// Auto-save book on detail page view + increment view_count
// Called by BookDetailClient on mount.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { isbn, title, author, cover_url, publisher, language } = await req.json()
    if (!isbn || !/^(978|979)\d{10}$/.test(isbn)) {
      return NextResponse.json({ error: 'invalid isbn' }, { status: 400 })
    }

    const sb = admin()

    // ตรวจว่ามีในระบบหรือยัง
    const { data: existing } = await sb
      .from('books')
      .select('id, view_count')
      .eq('isbn', isbn)
      .maybeSingle()

    if (existing) {
      // มีอยู่แล้ว → แค่ increment view_count
      await sb
        .from('books')
        .update({ view_count: (existing.view_count || 0) + 1 })
        .eq('id', existing.id)
      return NextResponse.json({ ok: true, view_count: (existing.view_count || 0) + 1 })
    }

    // ยังไม่มี + มี title → insert ใหม่ พร้อม view_count = 1
    if (!title) {
      return NextResponse.json({ ok: true, skipped: true })
    }
    const { error: insertErr } = await sb.from('books').insert({
      isbn,
      title,
      author: author || '',
      publisher: publisher || null,
      cover_url: cover_url || null,
      language: language || 'th',
      source: 'google_books',
      view_count: 1,
    })
    if (insertErr) {
      console.error('[/api/books/view] insert error:', insertErr.message)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, created: true, view_count: 1 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
