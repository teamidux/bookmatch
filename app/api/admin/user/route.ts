// Admin API: ดูประวัติ user ทั้งหมด — เบอร์เก่า ชื่อเก่า listings sessions ทุกอย่าง
// ใช้ตรวจสอบคนโกงที่เปลี่ยนเบอร์/ชื่อหนี
//
// GET /api/admin/user?id=<user_id>
// GET /api/admin/user?phone=0812345678
// GET /api/admin/user?name=ชื่อ

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/session'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const session = await getSessionUser()
  if (!session || !isAdmin(session.id)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const userId = req.nextUrl.searchParams.get('id')
  const phone = req.nextUrl.searchParams.get('phone')
  const name = req.nextUrl.searchParams.get('name')

  const sb = db()
  let targetUserId = userId

  // ค้นหา user จากเบอร์ (รวมเบอร์เก่าใน log)
  if (!targetUserId && phone) {
    const cleaned = phone.replace(/\D/g, '')
    if (!cleaned) return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
    // หาจาก users.phone ปัจจุบัน
    const { data: u } = await sb.from('users').select('id').eq('phone', cleaned).maybeSingle()
    if (u) {
      targetUserId = u.id
    } else {
      // หาจาก log เบอร์เก่า — eq() ใช้ parameterized query ปลอดภัย
      const { data: logOld } = await sb.from('phone_changes_log').select('user_id').eq('old_phone', cleaned).limit(1).maybeSingle()
      const { data: logNew } = !logOld ? await sb.from('phone_changes_log').select('user_id').eq('new_phone', cleaned).limit(1).maybeSingle() : { data: null }
      if (logOld) targetUserId = logOld.user_id
      else if (logNew) targetUserId = logNew.user_id
    }
  }

  // ค้นหา user จากชื่อ — sanitize เพื่อกัน filter injection
  if (!targetUserId && name) {
    const safeName = name.replace(/[%_\\,()]/g, '')
    if (!safeName.trim()) return NextResponse.json({ error: 'invalid_name' }, { status: 400 })
    const { data: u } = await sb.from('users').select('id')
      .ilike('display_name', `%${safeName}%`)
      .limit(1)
      .maybeSingle()
    if (u) targetUserId = u.id
    // หาจาก log ชื่อเก่า — ใช้ ilike แยกเพื่อกัน injection
    if (!targetUserId) {
      const { data: logOld } = await sb.from('phone_changes_log').select('user_id').ilike('old_phone', `%[name]%${safeName}%`).limit(1).maybeSingle()
      const { data: logNew } = !logOld ? await sb.from('phone_changes_log').select('user_id').ilike('new_phone', `%[name]%${safeName}%`).limit(1).maybeSingle() : { data: null }
      if (logOld) targetUserId = logOld.user_id
      else if (logNew) targetUserId = logNew.user_id
    }
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
  }

  // ดึงข้อมูลทั้งหมดพร้อมกัน
  const [userRes, changesRes, listingsRes, sessionsRes, contactsRes] = await Promise.all([
    // 1. ข้อมูล user ปัจจุบัน
    sb.from('users').select('*').eq('id', targetUserId).maybeSingle(),
    // 2. ประวัติเปลี่ยนเบอร์ + ชื่อ
    sb.from('phone_changes_log').select('*').eq('user_id', targetUserId).order('changed_at', { ascending: false }).limit(50),
    // 3. ประกาศขายทั้งหมด (รวมที่ลบแล้ว)
    sb.from('listings').select('id, book_id, condition, price, contact, status, created_at, books(isbn, title)').eq('seller_id', targetUserId).order('created_at', { ascending: false }).limit(50),
    // 4. Sessions (IP + device)
    sb.from('sessions').select('id, ua, ip, created_at').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(20),
    // 5. Contact events — คนที่กดติดต่อ user นี้
    sb.from('contact_events').select('id, listing_id, buyer_id, created_at').eq('seller_id', targetUserId).order('created_at', { ascending: false }).limit(30),
  ])

  return NextResponse.json({
    user: userRes.data,
    // แยก phone changes กับ name changes
    phone_changes: (changesRes.data || []).filter((c: any) => !c.old_phone?.startsWith('[name]') && !c.new_phone?.startsWith('[name]')),
    name_changes: (changesRes.data || []).filter((c: any) => c.old_phone?.startsWith('[name]') || c.new_phone?.startsWith('[name]')).map((c: any) => ({
      ...c,
      old_name: c.old_phone?.replace('[name] ', '') || null,
      new_name: c.new_phone?.replace('[name] ', '') || null,
    })),
    listings: listingsRes.data || [],
    sessions: sessionsRes.data || [],
    contact_events: contactsRes.data || [],
    // สรุปสำหรับ admin
    summary: {
      immutable_ids: {
        line_user_id: userRes.data?.line_user_id || null,
        facebook_id: userRes.data?.facebook_id || null,
      },
      total_phone_changes: (changesRes.data || []).filter((c: any) => !c.old_phone?.startsWith('[name]')).length,
      total_name_changes: (changesRes.data || []).filter((c: any) => c.old_phone?.startsWith('[name]')).length,
      total_listings: (listingsRes.data || []).length,
      unique_ips: Array.from(new Set((sessionsRes.data || []).map((s: any) => s.ip).filter(Boolean))),
    },
  })
}
