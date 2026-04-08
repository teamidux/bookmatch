// Google Books API client — สำหรับ search หนังสือ + ดึง metadata
// Server-side only. ใช้ GOOGLE_BOOKS_API_KEY (หรือ NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY fallback)

export type GoogleBook = {
  isbn: string
  title: string
  author: string
  publisher?: string
  cover_url?: string
  language?: string
}

// แปลง ISBN-10 → ISBN-13
function isbn10to13(isbn10: string): string {
  const stem = '978' + isbn10.slice(0, 9)
  let sum = 0
  for (let i = 0; i < 12; i++) sum += parseInt(stem[i]) * (i % 2 === 0 ? 1 : 3)
  const check = (10 - (sum % 10)) % 10
  return stem + check
}

function extractISBN(info: any): string {
  const ids = info.industryIdentifiers || []
  const isbn13 = ids.find((id: any) => id.type === 'ISBN_13')?.identifier
  if (isbn13) return isbn13
  const isbn10 = ids.find((id: any) => id.type === 'ISBN_10')?.identifier
  if (isbn10 && /^\d{9}[\dX]$/.test(isbn10)) return isbn10to13(isbn10.slice(0, 9))
  return ''
}

function mapVolume(item: any): GoogleBook | null {
  const info = item.volumeInfo
  if (!info?.title) return null
  // ตัดเล่มที่ไม่มี author ออก (ข้อมูลไม่ครบ)
  if (!info.authors || !Array.isArray(info.authors) || info.authors.length === 0) return null
  const isbn = extractISBN(info)
  if (!isbn) return null
  const thumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || ''
  return {
    isbn,
    title: info.title,
    author: info.authors.join(', '),
    publisher: info.publisher || '',
    cover_url: thumb
      ? thumb.replace(/^http:\/\//, 'https://').replace(/&edge=\w+/g, '').replace(/&zoom=\d+/g, '')
      : '',
    language: info.language || '',
  }
}

async function callGoogleSearch(qParam: string, limit: number): Promise<GoogleBook[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
  const params = new URLSearchParams({
    q: qParam,
    maxResults: String(Math.min(40, Math.max(1, limit))),
    printType: 'books',
    orderBy: 'relevance',
  })
  if (apiKey) params.set('key', apiKey)
  const url = `https://www.googleapis.com/books/v1/volumes?${params.toString()}`

  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 8000)
  try {
    const r = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    if (!r.ok) {
      console.warn('[Google Books]', r.status, 'q:', qParam)
      return []
    }
    const d = await r.json()
    if (!d.items?.length) return []
    const out: GoogleBook[] = []
    const seen = new Set<string>()
    for (const item of d.items) {
      const mapped = mapVolume(item)
      if (!mapped || seen.has(mapped.isbn)) continue
      seen.add(mapped.isbn)
      out.push(mapped)
      if (out.length >= limit) break
    }
    return out
  } catch (err: any) {
    clearTimeout(t)
    console.error('[Google Books] error:', err?.message || err)
    return []
  }
}

/**
 * ค้น Google Books — intitle: ก่อน, fallback เป็น general ถ้าผลน้อย
 */
export async function fetchGoogleBooksByTitle(query: string, limit: number = 10): Promise<GoogleBook[]> {
  // 1. ลอง intitle: ก่อน — match title field โดยตรง = relevant สุด
  const inTitleResults = await callGoogleSearch(`intitle:${query}`, limit)

  // 2. ถ้าได้น้อยกว่า 3 → fallback general search
  if (inTitleResults.length < 3) {
    const generalResults = await callGoogleSearch(query, limit)
    // merge dedupe
    const seen = new Set(inTitleResults.map(b => b.isbn))
    for (const b of generalResults) {
      if (seen.has(b.isbn)) continue
      seen.add(b.isbn)
      inTitleResults.push(b)
      if (inTitleResults.length >= limit) break
    }
  }

  return inTitleResults
}

/**
 * ดึงข้อมูลหนังสือเล่มเดียวจาก ISBN
 */
export async function fetchGoogleBookByISBN(isbn: string): Promise<GoogleBook | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${apiKey ? `&key=${apiKey}` : ''}`
    const r = await fetch(url, { next: { revalidate: 3600 } })
    if (!r.ok) return null
    const d = await r.json()
    if (!d.items?.length) return null
    return mapVolume(d.items[0])
  } catch {
    return null
  }
}
