'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Nav, BottomNav, BookCover, SkeletonList } from '@/components/ui'

type Listing = {
  id: string
  seller_id: string
  price: number
  condition: string
  price_includes_shipping: boolean
  photos: string[] | null
  created_at: string
  books: {
    id: string
    isbn: string
    title: string
    author: string | null
    cover_url: string | null
    language: string | null
    wanted_count: number
  } | null
}

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'popular'
const PAGE_SIZE = 24

export default function BrowsePage() {
  const [items, setItems] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  // Filters
  const [sort, setSort] = useState<SortKey>('newest')
  const [condition, setCondition] = useState<string>('')
  const [lang, setLang] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)

  const buildQuery = useCallback((offset: number) => {
    const p = new URLSearchParams()
    p.set('limit', String(PAGE_SIZE))
    p.set('offset', String(offset))
    p.set('sort', sort)
    if (condition) p.set('condition', condition)
    if (lang) p.set('lang', lang)
    if (maxPrice && !isNaN(Number(maxPrice))) p.set('maxPrice', maxPrice)
    return p.toString()
  }, [sort, condition, lang, maxPrice])

  // Load ชุดแรก / รีเซ็ต เมื่อ filter เปลี่ยน
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      offsetRef.current = 0
      try {
        const r = await fetch('/api/listings/browse?' + buildQuery(0))
        const d = await r.json()
        if (cancelled) return
        setItems(d.listings || [])
        setTotal(d.total || 0)
        setHasMore(!!d.hasMore)
        offsetRef.current = (d.listings || []).length
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [buildQuery])

  // Infinite scroll — observe sentinel
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading) return
    const observer = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting || loadingMore) return
      setLoadingMore(true)
      try {
        const r = await fetch('/api/listings/browse?' + buildQuery(offsetRef.current))
        const d = await r.json()
        setItems(prev => [...prev, ...(d.listings || [])])
        setHasMore(!!d.hasMore)
        offsetRef.current += (d.listings || []).length
      } finally {
        setLoadingMore(false)
      }
    }, { rootMargin: '200px' })
    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [buildQuery, hasMore, loading, loadingMore])

  const clearFilters = () => {
    setCondition('')
    setLang('')
    setMaxPrice('')
    setSort('newest')
  }
  const hasActiveFilter = condition || lang || maxPrice || sort !== 'newest'

  return (
    <>
      <Nav />
      <div className="page">
        {/* Header */}
        <div style={{ padding: '16px 16px 0' }}>
          <h1 style={{ fontFamily: "'Kanit', sans-serif", fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0, marginBottom: 4 }}>
            หนังสือทั้งหมด
          </h1>
          <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 12 }}>
            {loading ? 'กำลังโหลด...' : `${total} เล่มพร้อมขาย`}
          </div>

          {/* Filter toggle */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
            <button
              onClick={() => setShowFilters(v => !v)}
              style={{
                background: showFilters || hasActiveFilter ? 'var(--primary)' : 'white',
                color: showFilters || hasActiveFilter ? 'white' : 'var(--ink2)',
                border: `1px solid ${showFilters || hasActiveFilter ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 20,
                padding: '8px 14px',
                minHeight: 44,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'Kanit',
                cursor: 'pointer',
              }}
            >
              🎚️ ตัวกรอง {hasActiveFilter ? '· เปิดอยู่' : ''}
            </button>

            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              style={{
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '8px 12px',
                minHeight: 44,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'Kanit',
                color: 'var(--ink2)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="newest">ใหม่ล่าสุด</option>
              <option value="price_asc">ราคาต่ำ → สูง</option>
              <option value="price_desc">ราคาสูง → ต่ำ</option>
              <option value="popular">ยอดนิยม</option>
            </select>

            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink3)',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'Kanit',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 8,
                }}
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              {/* Condition */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>สภาพ</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { v: '', label: 'ทั้งหมด' },
                    { v: 'brand_new', label: '🆕 มือหนึ่ง' },
                    { v: 'new', label: '✨ ใหม่มาก' },
                    { v: 'good', label: '👍 ดี' },
                    { v: 'fair', label: '📖 พอใช้' },
                  ].map(c => (
                    <button
                      key={c.v}
                      onClick={() => setCondition(c.v)}
                      style={{
                        background: condition === c.v ? 'var(--primary-light)' : 'white',
                        color: condition === c.v ? 'var(--primary-dark)' : 'var(--ink2)',
                        border: `1px solid ${condition === c.v ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 16,
                        padding: '6px 12px',
                        minHeight: 36,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'Kanit',
                        cursor: 'pointer',
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>ภาษา</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { v: '', label: 'ทั้งหมด' },
                    { v: 'th', label: 'ไทย' },
                    { v: 'en', label: 'อังกฤษ' },
                  ].map(c => (
                    <button
                      key={c.v}
                      onClick={() => setLang(c.v)}
                      style={{
                        background: lang === c.v ? 'var(--primary-light)' : 'white',
                        color: lang === c.v ? 'var(--primary-dark)' : 'var(--ink2)',
                        border: `1px solid ${lang === c.v ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 16,
                        padding: '6px 12px',
                        minHeight: 36,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'Kanit',
                        cursor: 'pointer',
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max price */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>ราคาไม่เกิน (บาท)</div>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  placeholder="เช่น 500"
                  min={0}
                  max={999999}
                  inputMode="numeric"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontFamily: 'Kanit',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="section" style={{ paddingTop: 0 }}>
          {loading && <SkeletonList count={6} />}

          {!loading && items.length === 0 && (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <div style={{ fontSize: 15 }}>ไม่พบหนังสือตามเงื่อนไขที่เลือก</div>
              {hasActiveFilter && (
                <button onClick={clearFilters} className="btn btn-ghost" style={{ maxWidth: 200, margin: '16px auto 0' }}>
                  ล้างตัวกรอง
                </button>
              )}
            </div>
          )}

          {!loading && items.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {items.map(l => (
                <Link key={l.id} href={`/book/${l.books?.isbn}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--surface)', overflow: 'hidden' }}>
                      {l.photos?.[0] ? (
                        <img src={l.photos[0]} alt={l.books?.title} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <BookCover isbn={l.books?.isbn} title={l.books?.title} size={120} />
                      )}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#121212', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 38 }}>
                        {l.books?.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <span className="price" style={{ fontSize: 16 }}>฿{l.price}</span>
                        {l.price_includes_shipping && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>ส่งฟรี</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {!loading && hasMore && (
            <div ref={loadMoreRef} style={{ textAlign: 'center', padding: '30px 0' }}>
              {loadingMore ? (
                <span className="spin" style={{ width: 24, height: 24 }} />
              ) : (
                <span style={{ fontSize: 13, color: 'var(--ink3)' }}>กำลังโหลดเพิ่ม...</span>
              )}
            </div>
          )}
          {!loading && !hasMore && items.length > 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', fontSize: 13, color: 'var(--ink3)' }}>
              — ครบทุกเล่มแล้ว —
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  )
}
