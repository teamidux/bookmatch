// รายงานชื่อหนังสือไม่ถูกต้อง → แจ้ง admin ให้ approve
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const user = await getSessionUser().catch(() => null)
  const { bookId, isbn, currentTitle, suggestedTitle } = await req.json()
  if (!suggestedTitle?.trim()) return NextResponse.json({ error: 'missing title' }, { status: 400 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // แจ้ง admin ทุกคน
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
  for (const adminId of adminIds) {
    try {
      await sb.from('notifications').insert({
        user_id: adminId,
        type: 'book_name_report',
        title: '✏️ แจ้งแก้ชื่อหนังสือ',
        body: `"${currentTitle}" → "${suggestedTitle}" (ISBN: ${isbn || '-'}) โดย ${user?.display_name || 'guest'}`,
        url: '/tomga/books',
        metadata: { book_id: bookId, isbn, current: currentTitle, suggested: suggestedTitle, reported_by: user?.id },
      })
    } catch {}
  }

  return NextResponse.json({ ok: true })
}
