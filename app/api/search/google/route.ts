// External book search (Google Books + OpenLibrary) + auto-cache.
// Slower path — called separately from /api/search/db so DB results
// render first and external results stream in.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchGoogleBooksByTitle, fetchOpenLibraryByQuery, normalizeThai, GoogleBook } from '@/lib/search'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('q')?.trim()
  if (!raw || raw.length < 2) return NextResponse.json({ results: [], debug: { reason: 'too short' } })
  const q = normalizeThai(raw)

  let google: GoogleBook[] = []
  let openLib: GoogleBook[] = []
  let googleErr: string | null = null
  let openLibErr: string | null = null

  try {
    google = await fetchGoogleBooksByTitle(q, 15)
  } catch (e: any) { googleErr = e?.message || String(e) }
  try {
    openLib = await fetchOpenLibraryByQuery(q, 10)
  } catch (e: any) { openLibErr = e?.message || String(e) }

  // Merge + dedupe by ISBN, Google ก่อน (cover คุณภาพดีกว่า)
  const seen = new Set<string>()
  const gBooks: GoogleBook[] = []
  for (const b of [...google, ...openLib]) {
    if (seen.has(b.isbn)) continue
    seen.add(b.isbn)
    gBooks.push(b)
  }

  if (gBooks.length === 0) {
    return NextResponse.json({
      results: [],
      debug: { q, raw, googleCount: google.length, openLibCount: openLib.length, googleErr, openLibErr }
    })
  }

  // Auto-cache new books — normalize Thai sara am ก่อนเก็บ
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabase.from('books').upsert(
      gBooks.map(b => ({
        isbn: b.isbn,
        title: normalizeThai(b.title),
        author: normalizeThai(b.author || ''),
        publisher: b.publisher ? normalizeThai(b.publisher) : null,
        cover_url: b.cover_url || null,
        language: b.language || 'th',
        source: 'google_books',
      })),
      { onConflict: 'isbn', ignoreDuplicates: true }
    )
  } catch (err) {
    console.error('[search/google auto-cache]', err)
  }

  const results = gBooks.map(b => ({
    isbn: b.isbn,
    title: normalizeThai(b.title),
    author: normalizeThai(b.author || ''),
    cover_url: b.cover_url,
    source: 'google' as const,
  }))

  return NextResponse.json({ results })
}
