export type GoogleBook = {
  isbn: string
  title: string
  author: string
  publisher?: string
  cover_url?: string
  language?: string
}

export async function fetchGoogleBooksByTitle(query: string): Promise<GoogleBook[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
    const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}&maxResults=5${apiKey ? `&key=${apiKey}` : ''}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const r = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!r.ok) return []
    const d = await r.json()
    if (!d.items?.length) return []
    return d.items
      .map((item: any) => {
        const info = item.volumeInfo
        const isbn13 = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier || ''
        if (!isbn13 || !info.title) return null
        const thumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || ''
        return {
          isbn: isbn13,
          title: info.title,
          author: info.authors?.join(', ') || '',
          publisher: info.publisher || '',
          cover_url: thumb ? thumb.replace(/^http:\/\//, 'https://').replace(/&edge=\w+/g, '').replace(/&zoom=\d+/g, '') : '',
          language: info.language || '',
        }
      })
      .filter(Boolean) as GoogleBook[]
  } catch {
    return []
  }
}

// Map ตัวเลขอารบิก → คำไทย และกลับกัน
const ARABIC_TO_THAI: Record<string, string> = {
  '0': 'ศูนย์', '1': 'หนึ่ง', '2': 'สอง', '3': 'สาม',
  '4': 'สี่', '5': 'ห้า', '6': 'หก', '7': 'เจ็ด',
  '8': 'แปด', '9': 'เก้า',
}
const THAI_TO_ARABIC: Array<[RegExp, string]> = [
  [/ศูนย์/g, '0'], [/หนึ่ง/g, '1'], [/สอง/g, '2'], [/สาม/g, '3'],
  [/สี่/g, '4'], [/ห้า/g, '5'], [/หก/g, '6'], [/เจ็ด/g, '7'],
  [/แปด/g, '8'], [/เก้า/g, '9'],
]

// Normalize สระสั้น → สระยาว: ิ→ี  ุ→ู  ึ→ื
function vowelShortToLong(s: string): string {
  return s.replace(/\u0E34/g, '\u0E35').replace(/\u0E38/g, '\u0E39').replace(/\u0E36/g, '\u0E37')
}
// Normalize สระยาว → สระสั้น: ี→ิ  ู→ุ  ื→ึ
function vowelLongToShort(s: string): string {
  return s.replace(/\u0E35/g, '\u0E34').replace(/\u0E39/g, '\u0E38').replace(/\u0E37/g, '\u0E36')
}

/**
 * สร้าง query variants เพื่อ fuzzy search:
 * - ตัวเลขอารบิก ↔ คำไทย  (4 ↔ สี่)
 * - มีช่องว่าง / ไม่มีช่องว่าง
 * - สระสั้น ↔ สระยาว  (ทิม ↔ ทีม)
 */
export function searchVariants(q: string): string[] {
  const base = q.trim().replace(/\s+/g, ' ')
  const set = new Set<string>()

  const add = (s: string) => {
    const t = s.trim()
    if (t.length >= 1) {
      set.add(t)
      // เพิ่มแบบไม่มี space ถ้าต่างจากต้นฉบับ
      const noSpace = t.replace(/\s/g, '')
      if (noSpace !== t) set.add(noSpace)
    }
  }

  add(base)

  // สระสั้น ↔ สระยาว (เช่น "ทิม" → "ทีม", "ทีม" → "ทิม")
  const shortToLong = vowelShortToLong(base)
  if (shortToLong !== base) add(shortToLong)
  const longToShort = vowelLongToShort(base)
  if (longToShort !== base) add(longToShort)

  // อารบิก → ไทย (เช่น "4 แผ่นดิน" → "สี่ แผ่นดิน" → "สี่แผ่นดิน")
  const toThai = base.replace(/[0-9]/g, d => ARABIC_TO_THAI[d] ?? d)
  if (toThai !== base) add(toThai)

  // ไทย → อารบิก (เช่น "สี่แผ่นดิน" → "4แผ่นดิน")
  let toArabic = base
  for (const [re, digit] of THAI_TO_ARABIC) toArabic = toArabic.replace(re, digit)
  if (toArabic !== base) add(toArabic)

  // กรณี toThai มี space ต้องลอง toThai ไม่มี space ด้วย
  if (toThai !== base) {
    let tt = toThai
    for (const [re, digit] of THAI_TO_ARABIC) tt = tt.replace(re, digit)
    if (tt !== toThai) add(tt)
  }

  return Array.from(set)
}

/**
 * สร้าง Supabase .or() string จาก variants
 * columns: ['title', 'author']
 */
export function buildOrFilter(variants: string[], columns = ['title', 'author']): string {
  return variants
    .flatMap(v => columns.map(col => `${col}.ilike.%${v}%`))
    .join(',')
}
