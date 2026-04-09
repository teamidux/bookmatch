// Unified search — DB + Google Books
// mode=db   → query เฉพาะ DB (default สำหรับ live search, ฟรี ไม่กิน Google quota)
// mode=all  → query DB + Google parallel + auto-cache ทุกเล่มที่ valid (เฉพาะตอน user
//             explicit click "ค้นในคลังทั้งหมด")
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchGoogleBooksByTitle, rankBooksByQuery, normalizeForMatch } from '@/lib/search'

// Edge runtime: รันที่ edge ใกล้ user (Singapore สำหรับผู้ใช้ไทย) ไม่ใช่ที่
// iad1 ตาม Hobby plan default — สำคัญเพราะ Google Books API geo-localize
// ตาม caller IP, ถ้ารันที่ US จะได้แต่หนังสือไม่เกี่ยวกับหนังสือไทย
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 1) return NextResponse.json({ results: [] })

  // mode: 'db' = DB only (live search), 'all' = DB + Google + auto-cache
  // default 'all' เพื่อ backward compat — frontend ที่ใหม่จะส่ง mode=db ตอน live search
  const mode = req.nextUrl.searchParams.get('mode') === 'db' ? 'db' : 'all'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ค้น DB และ Google Books คู่ขนาน
  // ใช้ 2 separate queries แทน .or() — supabase-js OR filter มี edge case
  // กับ Thai chars บน HTTP/PostgREST ที่ทำให้ query บางตัว return 0 ทั้งที่
  // SQL ILIKE ปกติทำงานได้ (verified with ขุนช้างขุนแผน case)
  const escaped = q.replace(/[%_]/g, '\\$&')
  const escapedNoWs = escaped.replace(/\s+/g, '')
  const variants: string[] = [escaped]
  if (escapedNoWs !== escaped && escapedNoWs.length > 0) variants.push(escapedNoWs)

  const dbQuery = (async () => {
    try {
      const queries: any[] = []
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i]
        queries.push(
          supabase.from('books').select('id, isbn, title, author, cover_url, wanted_count').ilike('title', `%${v}%`).limit(20),
          supabase.from('books').select('id, isbn, title, author, cover_url, wanted_count').ilike('author', `%${v}%`).limit(10),
        )
      }
      const results: any[] = await Promise.all(queries)
      const merged: any[] = []
      const seen = new Set<string>()
      for (const r of results) {
        for (const b of (r.data || [])) {
          if (!b.id || seen.has(b.id)) continue
          seen.add(b.id)
          merged.push(b)
          if (merged.length >= 30) break
        }
        if (merged.length >= 30) break
      }
      return merged
    } catch (err: any) {
      console.error('[search] db query error:', err?.message || err)
      return []
    }
  })()
  // mode=db: ข้าม Google ทั้งหมด → ฟรี ไม่กิน quota
  // mode=all: ดึง Google ขนานกับ DB
  const googlePromise = mode === 'db'
    ? Promise.resolve([] as any[])
    : fetchGoogleBooksByTitle(q, 20).catch((err: any) => {
        console.error('[search] google fail:', err?.message || err)
        return [] as any[]
      })
  const [google, dbBooks] = await Promise.all([googlePromise, dbQuery])

  // ดึง listings count + min_price จริงจาก listings table (ไม่ trust column ใน books)
  const bookIds = (dbBooks || []).map(b => b.id).filter(Boolean)
  const listingMap: Record<string, { count: number; min_price: number }> = {}
  if (bookIds.length > 0) {
    const { data: listings } = await supabase
      .from('listings')
      .select('book_id, price')
      .in('book_id', bookIds)
      .eq('status', 'active')
    for (const l of listings || []) {
      if (!listingMap[l.book_id]) listingMap[l.book_id] = { count: 0, min_price: l.price }
      listingMap[l.book_id].count++
      if (l.price < listingMap[l.book_id].min_price) listingMap[l.book_id].min_price = l.price
    }
  }

  // Merge by ISBN — DB ก่อน (มี marketplace data) แล้วเติมด้วย Google
  const byIsbn = new Map<string, any>()

  for (const b of dbBooks) {
    if (!b.isbn) continue
    const lm = listingMap[b.id] || { count: 0, min_price: null as any }
    byIsbn.set(b.isbn, {
      isbn: b.isbn,
      title: b.title,
      author: b.author || '',
      cover_url: b.cover_url || null,
      active_listings_count: lm.count,
      min_price: lm.min_price,
      wanted_count: b.wanted_count || 0,
      source: 'db' as const,
    })
  }

  for (const b of google) {
    if (byIsbn.has(b.isbn)) continue
    byIsbn.set(b.isbn, {
      isbn: b.isbn,
      title: b.title,
      author: b.author || '',
      cover_url: b.cover_url || null,
      active_listings_count: 0,
      min_price: null,
      wanted_count: 0,
      source: 'google' as const,
    })
  }

  // 1. Rank by relevance (prefix > substring) — แก้ปัญหา Google ranking
  const allBooks = Array.from(byIsbn.values())
  const ranked = rankBooksByQuery(allBooks, q)

  // 2. แยกเป็น 2 กลุ่ม: มีคนขาย vs ไม่มี — แต่ละกลุ่มยังเรียงตาม relevance
  const withListings = ranked.filter(b => (b.active_listings_count || 0) > 0)
  const noListings = ranked.filter(b => (b.active_listings_count || 0) === 0)

  // เล่มมีคนขายก่อน → เล่มไม่มีคนขายตามมา (ทั้งคู่ระดับ relevance ภายในกลุ่ม)
  const results = [...withListings, ...noListings]

  // 3. ตรวจคุณภาพ match ของ top result — แยก 'exact' (ตรง/prefix) vs 'partial' (substring)
  // ใช้ normalize ตัวเดียวกับ rank เพื่อให้ "แฮร์รี่" vs "แฮรี่" ถือเป็น exact ด้วย
  const topNorm = normalizeForMatch(results[0]?.title || '')
  const qNorm = normalizeForMatch(q)
  const isExact = !!qNorm && (topNorm === qNorm || topNorm.startsWith(qNorm))
  const matchQuality: 'exact' | 'partial' | 'none' =
    results.length === 0 ? 'none' : isExact ? 'exact' : 'partial'

  // 4. AUTO-CACHE — เก็บ "ทุก" เล่มจาก Google ที่มี ISBN valid (ไม่ filter ด้วย rank)
  // เหตุผล: Google คืน 20 เล่ม/call ที่อาจไม่ relevant กับ query ปัจจุบัน
  // แต่อาจ relevant กับ query อื่นในอนาคต — เก็บไว้ใน DB ฟรี ลด Google call ระยะยาว
  // (Storage ~500 bytes/เล่ม × 20 เล่ม/call = 10KB/call → free tier 500MB ใช้นาน)
  const dbIsbnSet = new Set((dbBooks || []).map((b: any) => b.isbn).filter(Boolean))
  const toCache = (google || [])
    .filter((b: any) =>
      b.isbn &&
      /^(978|979)\d{10}$/.test(b.isbn) &&
      !dbIsbnSet.has(b.isbn) &&
      b.title
    )
    .map((b: any) => ({
      isbn: b.isbn,
      // NFC normalize — กัน Thai unicode bug (composed/decomposed sara am)
      title: String(b.title).normalize('NFC'),
      author: String(b.author || '').normalize('NFC'),
      publisher: b.publisher ? String(b.publisher).normalize('NFC') : null,
      cover_url: b.cover_url || null,
      language: b.language || 'th',
      source: 'google_books',
    }))

  // ต้องมี service role key ถึงจะ insert ได้ (anon key โดน RLS block)
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  if (hasServiceRole && toCache.length > 0) {
    // Fire-and-forget — Edge runtime continues briefly after response
    // ถ้า cache fail ไม่กระทบ user experience (DB upsert ignore duplicates)
    supabase
      .from('books')
      .upsert(toCache, { onConflict: 'isbn', ignoreDuplicates: true })
      .then(({ error }: any) => {
        if (error) console.error('[search] cache fail:', error.message)
      })
  }

  return NextResponse.json({ results, matchQuality })
}
