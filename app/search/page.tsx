'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Book } from '@/lib/supabase'
import { GoogleBook } from '@/lib/search'
import { Nav, BottomNav, BookCover, SkeletonList } from '@/components/ui'

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={
      <><Nav /><div style={{ textAlign: 'center', padding: 60 }}><span className="spin" style={{ width: 28, height: 28 }} /></div></>
    }>
      <SearchPage />
    </Suspense>
  )
}

function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<Book[]>([])
  const [googleResults, setGoogleResults] = useState<GoogleBook[]>([])
  const [loading, setLoading] = useState(false)
  const [expanding, setExpanding] = useState(false)
  const [matchQuality, setMatchQuality] = useState<'exact' | 'partial' | 'none'>('none')
  const [searched, setSearched] = useState(false)

  // โหลดผลจาก URL param เมื่อเข้าหน้าครั้งแรก
  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery(q)
    if (q) { doSearch(q); setSearched(true) }
  }, [searchParams])

  // debounced live search — DB → ถ้าน้อย auto-fallback Google
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) { setResults([]); setGoogleResults([]); setSearched(false); return }
    if (trimmed.length < 3) { setResults([]); setGoogleResults([]); return }
    const t = setTimeout(() => { doSearch(trimmed); setSearched(true) }, 350)
    return () => clearTimeout(t)
  }, [query])

  const doSearch = async (q: string, forceMode?: 'all') => {
    if (!q.trim()) return
    setLoading(true)
    const FALLBACK_THRESHOLD = 3
    try {
      // Step 1: DB ก่อน (เว้นแต่ user force mode=all เช่นกดปุ่ม "ค้นหา")
      const initialMode = forceMode || 'db'
      const r1 = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&mode=${initialMode}`)
      const data1 = await r1.json()
      let allResults = data1.results || []
      let mq = data1.matchQuality || 'none'

      // Step 2: ถ้า initial DB เจอน้อย → fallback ไป Google + auto-cache
      if (initialMode === 'db' && allResults.length < FALLBACK_THRESHOLD) {
        setExpanding(true)
        const r2 = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&mode=all`)
        const data2 = await r2.json()
        allResults = data2.results || allResults
        mq = data2.matchQuality || mq
        setExpanding(false)
      }

      const withListings = allResults.filter((b: any) => (b.active_listings_count || 0) > 0)
      const noListings = allResults.filter((b: any) => (b.active_listings_count || 0) === 0)
      setResults(withListings)
      setGoogleResults(noListings)
      setMatchQuality(mq)
    } catch {
      setResults([])
      setGoogleResults([])
      setMatchQuality('none')
    } finally {
      setLoading(false)
      setExpanding(false)
    }
  }

  const handleSubmit = () => {
    if (!query.trim()) return
    // กด "ค้นหา" → force mode=all เสมอ (ดึงเต็มที่)
    doSearch(query, 'all')
    setSearched(true)
  }

  return (
    <>
      <Nav />
      <div className="page">
        <div style={{ padding: '16px 0 8px' }}>
          <div className="search-row" style={{ maxWidth: 440, margin: '0 auto 0' }}>
            <input
              className="search-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อหนังสือ..."
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            <button className="btn-search" onClick={handleSubmit}>ค้นหา</button>
          </div>
        </div>

        <div className="section">
          {loading && <SkeletonList count={4} />}

          {!loading && results.length === 0 && googleResults.length === 0 && searched && query.trim() && (
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
                ไม่พบหนังสือ "{query}"
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.6, marginBottom: 16, maxWidth: 320, margin: '0 auto 16px' }}>
                ลองพิมพ์ชื่อให้ครบ ใช้ ISBN หรือสแกน barcode
              </div>
            </div>
          )}

          {!loading && (results.length + googleResults.length) > 0 && (
            <div style={{ padding: '4px 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--ink2)', letterSpacing: '0.02em' }}>
              พบ {results.length + googleResults.length} เล่ม
              {expanding && <span style={{ marginLeft: 8, color: 'var(--ink3)', fontWeight: 500 }}>· กำลังค้นเพิ่ม...</span>}
            </div>
          )}

          {/* รวม with listings + no listings เป็น list เดียว — listings ก่อน */}
          {[...results, ...(googleResults as any[])].map((b: any) => {
            const hasListing = (b.active_listings_count || 0) > 0
            return (
              <Link key={b.isbn} href={`/book/${b.isbn}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card">
                  <div className="book-card">
                    <BookCover isbn={b.isbn} title={b.title} size={60} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="book-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
                      <div className="book-author">{b.author}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {hasListing && b.min_price ? (
                          <>
                            <span className="price">฿{b.min_price}</span>
                            <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{b.active_listings_count} คนขาย</span>
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--ink3)' }}>ยังไม่มีคนขาย</span>
                        )}
                        {b.wanted_count > 0 && <span className="badge badge-blue">🔔 {b.wanted_count} คนรอซื้อ</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        <div style={{ height: 12 }} />
      </div>
      <BottomNav />
    </>
  )
}
