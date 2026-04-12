// แจ้งเตือนคนที่ตามหา เมื่อมีคนลงขายหนังสือเล่มนั้น
// เรียกจาก sell page หลัง listing insert สำเร็จ
// ส่ง LINE OA message (ฟรี 200/เดือน) — web push ไว้เพิ่มทีหลัง

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pushLineText } from '@/lib/line-bot'

export const runtime = 'nodejs'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    // ต้อง login แล้วเท่านั้น (เรียกจาก sell page หลัง listing insert)
    const { getSessionUser } = await import('@/lib/session')
    const sessionUser = await getSessionUser()
    if (!sessionUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { book_id, seller_id, price, isbn } = await req.json()
    if (!book_id || !seller_id) return NextResponse.json({ ok: true, sent: 0 })

    const sb = db()

    // ดึงชื่อหนังสือ
    const { data: book } = await sb
      .from('books')
      .select('title, isbn')
      .eq('id', book_id)
      .maybeSingle()
    if (!book) return NextResponse.json({ ok: true, sent: 0 })

    const bookIsbn = isbn || book.isbn

    // หาคนที่ตามหาเล่มนี้ (ไม่รวม seller เองถ้า seller เคยตามหา)
    const { data: wanted } = await sb
      .from('wanted')
      .select('user_id')
      .eq('book_id', book_id)
      .eq('status', 'waiting')
      .neq('user_id', seller_id)
    if (!wanted?.length) return NextResponse.json({ ok: true, sent: 0 })

    const userIds = wanted.map(w => w.user_id)

    // Dedup: เช็คว่าเคยแจ้ง (user, book, seller) ไปแล้วหรือยัง
    // ถ้าเคยแล้ว → skip (seller เดิมลงเล่มเดิม ไม่ต้องแจ้งซ้ำ)
    const { data: alreadyNotified } = await sb
      .from('wanted_notifications')
      .select('user_id')
      .eq('book_id', book_id)
      .eq('seller_id', seller_id)
      .in('user_id', userIds)
    const notifiedSet = new Set((alreadyNotified || []).map(r => r.user_id))
    const freshUserIds = userIds.filter(id => !notifiedSet.has(id))
    if (!freshUserIds.length) return NextResponse.json({ ok: true, sent: 0, skipped: userIds.length })

    // ดึงเฉพาะคนที่ add OA แล้ว (ไม่งั้นส่งไปก็ fail + เสียเครดิต)
    const { data: users } = await sb
      .from('users')
      .select('id, display_name, line_user_id')
      .in('id', freshUserIds)
      .not('line_user_id', 'is', null)
      .not('line_oa_friend_at', 'is', null)

    let sent = 0
    const logRows: { user_id: string; book_id: string; seller_id: string }[] = []
    for (const u of users || []) {
      const msg = `📚 หนังสือที่คุณตามหามีคนลงขายแล้ว!\n\n"${book.title}"\nราคา ฿${price || '—'}\n\nดูรายละเอียด:\nbookmatch.app/book/${bookIsbn}`
      const result = await pushLineText(u.line_user_id, msg)
      if (result.success) {
        sent++
        logRows.push({ user_id: u.id, book_id, seller_id })
      }
    }

    // Log ว่าแจ้งไปแล้ว — ครั้งหน้า seller เดิมลงเล่มเดิม จะ skip
    // Seller คนใหม่มาลง → คนละ row → แจ้งได้
    if (logRows.length) {
      await sb.from('wanted_notifications').insert(logRows)
    }

    return NextResponse.json({ ok: true, sent, total_wanted: wanted.length, skipped: notifiedSet.size })
  } catch (e: any) {
    console.error('[notify/wanted-match]', e?.message)
    return NextResponse.json({ ok: true, sent: 0 }) // ไม่ให้ error block UX
  }
}
