// Admin API: ลบ test user — ลบ related data ทั้งหมดก่อนลบ user
// DELETE /api/admin/user/delete { userId }

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

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session || !isAdmin(session.id)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })

  // กัน admin ลบตัวเอง
  if (userId === session.id) {
    return NextResponse.json({ error: 'cannot_delete_self' }, { status: 400 })
  }

  const sb = db()

  // ลบ related data ตามลำดับ (FK constraints)
  const deleted: Record<string, number> = {}

  const tables = [
    { table: 'contact_events', column: 'seller_id' },
    { table: 'contact_events', column: 'buyer_id' },
    { table: 'notifications', column: 'user_id' },
    { table: 'push_subscriptions', column: 'user_id' },
    { table: 'phone_changes_log', column: 'user_id' },
    { table: 'phone_otps', column: 'user_id' },
    { table: 'sessions', column: 'user_id' },
    { table: 'wanted', column: 'user_id' },
    { table: 'wanted_notifications', column: 'user_id' },
    { table: 'search_logs', column: 'user_id' },
    { table: 'listings', column: 'seller_id' },
  ]

  for (const { table, column } of tables) {
    try {
      const { count } = await sb.from(table).delete({ count: 'exact' }).eq(column, userId)
      deleted[`${table}.${column}`] = count || 0
    } catch {
      // table อาจไม่มี — ข้าม
    }
  }

  // ลบ user สุดท้าย
  const { error } = await sb.from('users').delete().eq('id', userId)
  if (error) {
    return NextResponse.json({
      error: 'delete_failed',
      message: error.message,
      deleted_related: deleted,
    }, { status: 500 })
  }

  return NextResponse.json({ ok: true, deleted_related: deleted })
}
