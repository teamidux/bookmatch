// Helper สำหรับ log admin action ลง admin_actions table
// เรียกใน API endpoint หลัง action สำเร็จ — fire-and-forget
import { createClient } from '@supabase/supabase-js'

type LogParams = {
  adminId: string
  action: string
  targetType: 'user' | 'listing' | 'book'
  targetId: string
  reason?: string | null
  metadata?: Record<string, any>
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function logAdminAction(p: LogParams): Promise<void> {
  try {
    await db().from('admin_actions').insert({
      admin_id: p.adminId,
      action: p.action,
      target_type: p.targetType,
      target_id: p.targetId,
      reason: p.reason || null,
      metadata: p.metadata || null,
    })
  } catch (e) {
    console.error('[audit] failed to log', p.action, e)
    // ไม่ throw — audit fail ไม่ควร block business logic
  }
}
