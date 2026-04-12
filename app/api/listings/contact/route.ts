// Log contact event + แจ้งผู้ขายผ่าน Web Push
// เก็บทุกครั้งที่ผู้ซื้อกด "ติดต่อ" ผู้ขาย
// ไม่ต้อง auth — guest ก็กดได้ (เก็บ buyer_id ถ้า login)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/session'
import webpush from 'web-push'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { listing_id, book_id, seller_id } = await req.json()
    if (!listing_id) return NextResponse.json({ error: 'missing listing_id' }, { status: 400 })

    const user = await getSessionUser().catch(() => null)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await supabase.from('contact_events').insert({
      listing_id,
      book_id: book_id || null,
      seller_id: seller_id || null,
      buyer_id: user?.id || null,
    })

    // Web Push แจ้งผู้ขาย — fire-and-forget ไม่ block response
    if (seller_id) {
      notifySeller(supabase, seller_id, book_id).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // ไม่ให้ tracking error block UX
  }
}

async function notifySeller(supabase: any, sellerId: string, bookId: string | null) {
  const vapidSubject = process.env.VAPID_SUBJECT
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  if (!vapidSubject || !vapidPublic || !vapidPrivate) return

  // ดึง push subscription ของผู้ขาย
  const { data: sub } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', sellerId)
    .maybeSingle()
  if (!sub?.subscription) return

  // ดึงชื่อหนังสือ
  let bookTitle = 'หนังสือของคุณ'
  if (bookId) {
    const { data: book } = await supabase.from('books').select('title').eq('id', bookId).maybeSingle()
    if (book?.title) bookTitle = `"${book.title}"`
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
  const payload = JSON.stringify({
    title: 'มีคนสนใจหนังสือของคุณ!',
    body: `มีคนกดติดต่อเรื่อง ${bookTitle}`,
    url: '/profile',
    tag: `contact-${sellerId}`,
  })

  try {
    await webpush.sendNotification(sub.subscription, payload)
  } catch (e: any) {
    // Subscription หมดอายุ → ลบออก
    if (e.statusCode === 404 || e.statusCode === 410) {
      await supabase.from('push_subscriptions').delete().eq('user_id', sellerId)
    }
  }
}
