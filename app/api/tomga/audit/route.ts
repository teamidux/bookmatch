// Admin: read audit log
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function currentAdmin() {
  const token = cookies().get('bm_session')?.value
  if (!token) return null
  const db = sb()
  const { data } = await db.from('sessions').select('users(id)').eq('token', token).maybeSingle()
  const id = (data as any)?.users?.id
  return id && isAdmin(id) ? id : null
}

export async function GET(req: NextRequest) {
  if (!(await currentAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || ''

  const db = sb()
  let query = db
    .from('admin_actions')
    .select('id, action, target_type, target_id, reason, metadata, created_at, admin:admin_id(display_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (action) query = query.eq('action', action)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ actions: data || [] })
}
