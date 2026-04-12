// Retry missing ISBNs — ดึงจาก Google Books API ทีละ ISBN
// เจอแล้ว → insert เข้า books + mark resolved ใน missing_isbns
// ไม่ลบ record เดิม — เก็บไว้เพื่อวิเคราะห์
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchGoogleBookByISBN } from '@/lib/search'

export const runtime = 'nodejs'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'no service role key' }, { status: 500 })
  }

  const sb = admin()
  const body = await req.json().catch(() => ({}))
  const limit = Math.min(body.limit || 50, 200)
  const maxRetries = body.max_retries || 3

  // ดึง missing ISBNs ที่ยังไม่ resolved + retry ไม่เกิน max
  // เรียงตาม count (ยิ่งคนหาเยอะยิ่งสำคัญ)
  const { data: missing } = await sb
    .from('missing_isbns')
    .select('isbn, count, retry_count')
    .is('resolved_at', null)
    .lt('retry_count', maxRetries)
    .order('count', { ascending: false })
    .limit(limit)

  if (!missing?.length) {
    return NextResponse.json({ resolved: 0, checked: 0, message: 'no unresolved ISBNs' })
  }

  let resolved = 0
  const results: Array<{ isbn: string; found: boolean }> = []

  for (const m of missing) {
    const book = await fetchGoogleBookByISBN(m.isbn)
    if (!book) {
      // ไม่เจอ — เพิ่ม retry_count เพื่อไม่ยิงซ้ำไม่จำกัด
      await sb
        .from('missing_isbns')
        .update({ retry_count: (m.retry_count || 0) + 1, last_retry_at: new Date().toISOString() })
        .eq('isbn', m.isbn)
      results.push({ isbn: m.isbn, found: false })
      continue
    }

    // Insert เข้า books (ignore duplicate)
    const { data: inserted } = await sb
      .from('books')
      .upsert({
        isbn: book.isbn,
        title: book.title,
        author: book.author || '',
        publisher: book.publisher || null,
        cover_url: book.cover_url || null,
        language: book.language || 'th',
        source: 'google_books',
        category: book.category || null,
        list_price: book.list_price || null,
      }, { onConflict: 'isbn', ignoreDuplicates: true })
      .select('id')
      .maybeSingle()

    // Mark resolved
    const bookId = inserted?.id || null
    await sb
      .from('missing_isbns')
      .update({ resolved_at: new Date().toISOString(), resolved_book_id: bookId })
      .eq('isbn', m.isbn)

    resolved++
    results.push({ isbn: m.isbn, found: true })
  }

  return NextResponse.json({
    checked: missing.length,
    resolved,
    still_missing: missing.length - resolved,
    results,
  })
}
