// Admin API: ลบ user
// POST /api/admin/user/delete { userId, mode: 'hard' | 'soft' }
//
// hard: ลบทุกอย่างหมด (สำหรับ test data)
// soft: ซ่อนข้อมูลส่วนตัว แต่เก็บ listings/events เป็นหลักฐาน (production)

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

async function deleteFrom(sb: ReturnType<typeof db>, table: string, column: string, value: string): Promise<number> {
  try {
    const { count } = await sb.from(table).delete({ count: 'exact' }).eq(column, value)
    return count || 0
  } catch {
    return 0 // table อาจไม่มี
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session || !isAdmin(session.id)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { userId, mode = 'hard' } = await req.json()
  if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })
  if (userId === session.id) return NextResponse.json({ error: 'cannot_delete_self' }, { status: 400 })

  const sb = db()
  const deleted: Record<string, number> = {}

  if (mode === 'soft') {
    // === Soft Delete: ซ่อนข้อมูลส่วนตัว แต่เก็บหลักฐาน ===
    const { error } = await sb.from('users').update({
      display_name: 'ผู้ใช้ที่ลบบัญชี',
      avatar_url: null,
      line_id: null,
      phone: null,
      store_name: null,
      deleted_at: new Date().toISOString(),
      deleted_reason: 'admin_soft_delete',
    }).eq('id', userId)

    if (error) return NextResponse.json({ error: 'soft_delete_failed', message: error.message }, { status: 500 })

    // ปิด listings แต่ไม่ลบ
    await sb.from('listings').update({ status: 'removed' }).eq('seller_id', userId).eq('status', 'active')
    // ลบ sessions เตะออก
    await deleteFrom(sb, 'sessions', 'user_id', userId)

    return NextResponse.json({ ok: true, mode: 'soft', message: 'ข้อมูลส่วนตัวถูกลบ หลักฐานยังอยู่' })
  }

  // === Hard Delete: ลบทุกอย่าง (test data) ===
  // ต้องลบตามลำดับ FK — child tables ก่อน parent

  // 1. ดึง listing IDs ของ user นี้ (เพื่อลบ contact_events ที่อ้าง listing)
  const { data: userListings } = await sb.from('listings').select('id').eq('seller_id', userId)
  const listingIds = (userListings || []).map((l: any) => l.id)

  // 2. ลบ contact_events ที่อ้าง listings ของ user นี้
  if (listingIds.length > 0) {
    for (const lid of listingIds) {
      deleted['contact_events.listing_id'] = (deleted['contact_events.listing_id'] || 0) + await deleteFrom(sb, 'contact_events', 'listing_id', lid)
    }
  }

  // 3. ลบ contact_events ที่อ้าง user เป็น seller/buyer (กรณีอ้าง listing ของคนอื่น)
  deleted['contact_events.seller_id'] = await deleteFrom(sb, 'contact_events', 'seller_id', userId)
  deleted['contact_events.buyer_id'] = await deleteFrom(sb, 'contact_events', 'buyer_id', userId)

  // 4. ลบ tables ที่อ้าง user โดยตรง
  const userTables = [
    'notifications', 'push_subscriptions', 'phone_changes_log', 'phone_otps',
    'sessions', 'wanted', 'wanted_notifications', 'search_logs',
    'contact_messages', 'id_verifications', 'reports',
  ]
  for (const table of userTables) {
    deleted[table] = await deleteFrom(sb, table, 'user_id', userId)
  }
  // reports ที่ user นี้ถูกรายงาน
  deleted['reports.reported'] = await deleteFrom(sb, 'reports', 'reported_user_id', userId)
  // admin_actions
  deleted['admin_actions'] = await deleteFrom(sb, 'admin_actions', 'admin_id', userId)

  // 5. ลบ listings
  deleted['listings'] = await deleteFrom(sb, 'listings', 'seller_id', userId)

  // 6. ลบ user
  const { error } = await sb.from('users').delete().eq('id', userId)
  if (error) {
    return NextResponse.json({
      error: 'delete_user_failed',
      message: error.message,
      deleted_related: deleted,
      hint: 'อาจมี FK constraint ที่ยังไม่ได้ลบ — ดู message',
    }, { status: 500 })
  }

  return NextResponse.json({ ok: true, mode: 'hard', deleted_related: deleted })
}
