import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { userId, data } = await req.json()
  if (!userId || !data) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

  // อนุญาตแค่ field ที่ user แก้ได้เองเท่านั้น
  const allowed: Record<string, unknown> = {}
  if (typeof data.display_name === 'string') allowed.display_name = data.display_name.trim()
  if (data.line_id !== undefined) allowed.line_id = typeof data.line_id === 'string' ? data.line_id.trim() || null : null

  if (Object.keys(allowed).length === 0) return NextResponse.json({ error: 'no valid fields' }, { status: 400 })

  const { error } = await getSupabase().from('users').update(allowed).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
