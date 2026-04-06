'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, Book } from '@/lib/supabase'
// Book type still used for wantedBooks
import { Nav, BottomNav, BookCover, InAppBanner, useToast, Toast } from '@/components/ui'

export default function HomePage() {
  const router = useRouter()
  const [recentListings, setRecentListings] = useState<any[]>([])
  const [wantedBooks, setWantedBooks] = useState<Book[]>([])
  const [stats, setStats] = useState({ books: 0, sellers: 0, wanted: 0 })
  const [query, setQuery] = useState('')
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [loading, setLoading] = useState(true)
  const scannerRef = useRef<any>(null)
  const fallbackInputRef = useRef<HTMLInputElement>(null)
  const { msg, show } = useToast()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [recentRes, { data: wanted }, { count: sellerCount }, { count: bookCount }] = await Promise.all([
      fetch('/api/listings/recent?limit=10'),
      supabase.from('books').select('*').gt('wanted_count', 0).order('wanted_count', { ascending: false }).limit(3),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('books').select('*', { count: 'exact', head: true }),
    ])
    const { listings } = await recentRes.json()
    setRecentListings(listings || [])
    setWantedBooks(wanted || [])
    setStats({ books: bookCount || 0, sellers: sellerCount || 0, wanted: wanted?.reduce((s, b) => s + (b.wanted_count || 0), 0) || 0 })
    setLoading(false)
  }

  const isISBN = (q: string) => /^[\d-]{9,17}$/.test(q.replace(/\s/g, ''))

  const doSearch = () => {
    const q = query.trim()
    if (!q) return
    if (isISBN(q)) {
      router.push(`/book/${encodeURIComponent(q)}`)
    } else {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  const processISBN = (text: string) => {
    let isbn = text.trim()
    if (!/^(978|979)\d{10}$/.test(isbn) && /^\d{13}$/.test(isbn)) {
      const attempt = '9' + isbn.slice(1)
      if (/^(978|979)\d{10}$/.test(attempt)) isbn = attempt
    }
    if (!/^(978|979)\d{10}$/.test(isbn)) {
      setQuery(isbn)
      show('อ่านบาร์โค้ดไม่ชัด ลองใหม่อีกครั้ง')
      return
    }
    router.push(`/book/${isbn}`)
  }

  const startScan = async () => {
    setCameraError(false)
    setScanning(true)
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('scanner-div', { formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13], verbose: false })
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment', width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 } },
        { fps: 8, qrbox: { width: 300, height: 110 } },
        (text: string) => { scanner.stop(); setScanning(false); processISBN(text) },
        () => {}
      )
    } catch {
      setScanning(false)
      setCameraError(true)
    }
  }

  const scanFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const result = await Html5Qrcode.scanFile(file, false)
      setCameraError(false)
      processISBN(result)
    } catch {
      show('อ่านบาร์โค้ดไม่ได้ ลองถ่ายใหม่ให้เห็นบาร์โค้ดชัดขึ้น')
    }
  }

  const stopScan = () => {
    scannerRef.current?.stop()
    setScanning(false)
  }

  return (
    <>
      <Nav />
      <InAppBanner />
      <Toast msg={msg} />
      <div className="page">
        <div className="hero">
          <h1 className="hero-title">ตลาดหนังสือ<br /><em>ค้นหาด้วย ISBN</em></h1>
          <p className="hero-sub">มือหนึ่ง มือสอง ครบในที่เดียว</p>

          {!scanning && (
            <div className="search-row" style={{ maxWidth: 440, margin: '0 auto 10px' }}>
              <input
                className="search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="ISBN หรือชื่อหนังสือ..."
                onKeyDown={e => e.key === 'Enter' && doSearch()}
              />
              <button className="btn-search" onClick={doSearch}>ค้นหา</button>
            </div>
          )}

          {scanning ? (
            <div style={{ maxWidth: 440, margin: '0 auto', position: 'relative' }}>
              <div id="scanner-div" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }} />
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.8)', fontSize: 12, marginTop: 8, fontWeight: 500 }}>
                วางบาร์โค้ดหลังหนังสือให้อยู่ในกรอบแนวนอน
              </div>
              <button onClick={stopScan} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.6)', border: 'none', borderRadius: 20, padding: '5px 12px', color: 'white', fontFamily: 'Sarabun', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                ✕ ปิด
              </button>
            </div>
          ) : cameraError ? (
            <div style={{ maxWidth: 440, margin: '0 auto', background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.9)', marginBottom: 12 }}>กล้องเปิดอัตโนมัติไม่ได้ — ถ่ายรูปบาร์โค้ดแทนได้เลย</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <label style={{ background: 'white', color: '#1D4ED8', border: 'none', borderRadius: 10, padding: '10px 18px', fontFamily: 'Sarabun', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="file" accept="image/*" capture="environment" ref={fallbackInputRef} onChange={scanFromFile} style={{ display: 'none' }} />
                  📷 ถ่ายรูป
                </label>
                <label style={{ background: 'rgba(255,255,255,.25)', color: 'white', border: '1.5px solid rgba(255,255,255,.4)', borderRadius: 10, padding: '10px 18px', fontFamily: 'Sarabun', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="file" accept="image/*" onChange={scanFromFile} style={{ display: 'none' }} />
                  🖼️ เลือกรูป
                </label>
                <button onClick={startScan} style={{ background: 'transparent', color: 'rgba(255,255,255,.7)', border: '1.5px solid rgba(255,255,255,.3)', borderRadius: 10, padding: '10px 14px', fontFamily: 'Sarabun', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  ลองใหม่
                </button>
              </div>
            </div>
          ) : (
            <button onClick={startScan} style={{ background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)', borderRadius: 10, padding: '10px 18px', color: 'white', fontFamily: 'Sarabun', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}>
              📷 สแกน Barcode
            </button>
          )}
        </div>

        <div className="stats-bar">
          <div className="stat"><div className="stat-n">{stats.books}+</div><div className="stat-l">หนังสือ</div></div>
          <div className="stat"><div className="stat-n">{stats.sellers}</div><div className="stat-l">ผู้ขาย</div></div>
          <div className="stat"><div className="stat-n">{stats.wanted}</div><div className="stat-l">Wanted</div></div>
        </div>

        <div className="section">
          <div className="section-hd">
            <div className="section-title">ลงใหม่ล่าสุด</div>
          </div>
          {loading && <div style={{ textAlign: 'center', padding: 32 }}><span className="spin" style={{ width: 24, height: 24 }} /></div>}
          {!loading && recentListings.length === 0 && (
            <div className="empty">
              <div className="empty-icon">📚</div>
              <div style={{ marginBottom: 16 }}>ยังไม่มีหนังสือในระบบ</div>
              <Link href="/sell"><button className="btn" style={{ maxWidth: 200, margin: '0 auto', display: 'block' }}>ลงขายเป็นคนแรก</button></Link>
            </div>
          )}
          {recentListings.map((l: any) => (
            <Link key={l.id} href={`/book/${l.books?.isbn}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card">
                <div className="book-card">
                  {l.photos?.[0]
                    ? <img src={l.photos[0]} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    : <BookCover coverUrl={l.books?.cover_url} title={l.books?.title} size={52} />
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="book-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.books?.title}</div>
                    <div className="book-author">{l.books?.author}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span className="price">฿{l.price}</span>
                      {l.price_includes_shipping && <span style={{ fontSize: 11, color: 'var(--green)' }}>ส่งฟรี</span>}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {wantedBooks.length > 0 && (
          <div className="section" style={{ marginTop: 8 }}>
            <div className="section-hd">
              <div className="section-title">🔔 มีคนรอซื้ออยู่</div>
            </div>
            {wantedBooks.map(b => (
              <Link key={b.id} href={`/book/${b.isbn}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card">
                  <div className="book-card">
                    <BookCover coverUrl={b.cover_url} title={b.title} size={52} />
                    <div style={{ flex: 1 }}>
                      <div className="book-title">{b.title}</div>
                      <div className="book-author">{b.author}</div>
                      <div style={{ marginTop: 6 }}>
                        <span className="badge badge-blue">🔔 {b.wanted_count} คนรอซื้อ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div style={{ height: 12 }} />
      </div>
      <BottomNav />
    </>
  )
}
