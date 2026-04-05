'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, Book, Listing, fetchBookByISBN, CONDITIONS } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Nav, BottomNav, BookCover, CondBadge, LoginModal, useToast, Toast } from '@/components/ui'

export default function BookDetailClient({ isbn }: { isbn: string }) {
  const { user } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [isWanted, setIsWanted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [showWantedForm, setShowWantedForm] = useState(false)
  const [wantedPrice, setWantedPrice] = useState('')
  const { msg, show } = useToast()

  useEffect(() => { loadData() }, [isbn])

  const loadData = async () => {
    setLoading(true)
    let { data: dbBook } = await supabase.from('books').select('*').eq('isbn', isbn).maybeSingle()

    if (!dbBook) {
      const fetched = await fetchBookByISBN(isbn)
      if (fetched) {
        setBook(fetched as Book)
        setLoading(false)
        return
      }
    } else {
      setBook(dbBook)
      const { data: ls } = await supabase
        .from('listings')
        .select('*, users(id, display_name, sold_count, confirmed_count, is_verified)')
        .eq('book_id', dbBook.id)
        .eq('status', 'active')
        .order('price')
      setListings(ls || [])

      if (user) {
        const { data: w } = await supabase.from('wanted').select('id').eq('user_id', user.id).eq('book_id', dbBook.id).maybeSingle()
        setIsWanted(!!w)
      }
    }
    setLoading(false)
  }

  const toggleWanted = async () => {
    if (!user) { setShowLogin(true); return }
    if (!book?.id) return
    if (isWanted) {
      await supabase.from('wanted').delete().eq('user_id', user.id).eq('book_id', book.id)
      setIsWanted(false)
      show('ลบออกจาก Wanted List แล้ว')
    } else {
      setShowWantedForm(true)
    }
  }

  const confirmWanted = async () => {
    if (!user || !book?.id) return
    await supabase.from('wanted').insert({
      user_id: user.id,
      book_id: book.id,
      isbn,
      max_price: wantedPrice ? parseFloat(wantedPrice) : null,
      status: 'waiting',
    })
    setIsWanted(true)
    setShowWantedForm(false)
    show('เพิ่มใน Wanted List แล้ว 🔔')
  }

  const prices = listings.map(l => l.price)
  const minP = prices.length ? Math.min(...prices) : null
  const maxP = prices.length ? Math.max(...prices) : null
  const avgP = prices.length ? Math.round(prices.reduce((a, b) => a + b) / prices.length) : null

  if (loading) return (
    <><Nav /><div style={{ textAlign: 'center', padding: 60 }}><span className="spin" style={{ width: 28, height: 28 }} /></div></>
  )

  if (!book) return (
    <><Nav />
      <div className="empty" style={{ paddingTop: 60 }}>
        <div className="empty-icon">🔍</div>
        <div style={{ marginBottom: 16 }}>ไม่พบหนังสือ ISBN นี้</div>
        <Link href="/sell"><button className="btn" style={{ maxWidth: 200, margin: '0 auto', display: 'block' }}>ลงขายเป็นรายแรก</button></Link>
      </div>
    </>
  )

  return (
    <>
      <Nav />
      <Toast msg={msg} />
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onDone={() => { setShowLogin(false); loadData() }} />}

      {showWantedForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowWantedForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '18px 18px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, margin: '0 auto' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 4 }}>เพิ่มใน Wanted List</div>
            <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 16 }}>เราจะแจ้งเตือนเมื่อมีคนลงขายเล่มนี้</div>
            <div className="form-group">
              <label className="label">ราคาสูงสุดที่ยอมจ่าย (ไม่บังคับ)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, color: 'var(--ink3)' }}>฿</span>
                <input className="input" type="number" value={wantedPrice} onChange={e => setWantedPrice(e.target.value)} placeholder="เช่น 200" />
              </div>
            </div>
            <button className="btn" onClick={confirmWanted}>เพิ่มใน Wanted List 🔔</button>
            <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setShowWantedForm(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      <div className="page">
        <Link href="/" className="back-btn">← กลับ</Link>

        <div style={{ background: 'var(--primary)', padding: '16px', display: 'flex', gap: 14 }}>
          <BookCover coverUrl={book.cover_url} title={book.title} size={68} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: 'white', lineHeight: 1.3, marginBottom: 3 }}>{book.title}</div>
            {book.author && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginBottom: 5 }}>{book.author}</div>}
            <div style={{ fontSize: 11, color: '#93c5fd', fontWeight: 700, marginBottom: 10 }}>ISBN: {isbn}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={toggleWanted} style={{ background: isWanted ? 'white' : 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 8, padding: '7px 12px', fontFamily: 'Sarabun', fontWeight: 700, fontSize: 12, color: isWanted ? 'var(--primary)' : 'white', cursor: 'pointer' }}>
                {isWanted ? '🔔 อยู่ใน Wanted' : '🔔 ต้องการเล่มนี้'}
              </button>
              <Link href={`/sell?isbn=${isbn}`}>
                <button style={{ background: 'white', border: 'none', borderRadius: 8, padding: '7px 12px', fontFamily: 'Sarabun', fontWeight: 700, fontSize: 12, color: 'var(--primary)', cursor: 'pointer' }}>
                  ขายเล่มนี้
                </button>
              </Link>
            </div>
          </div>
        </div>

        {prices.length > 0 && (
          <div style={{ background: 'var(--surface)', padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}><div className="price">฿{minP}</div><div style={{ fontSize: 11, color: 'var(--ink3)' }}>ต่ำสุด</div></div>
            <div style={{ textAlign: 'center' }}><div className="price">฿{avgP}</div><div style={{ fontSize: 11, color: 'var(--ink3)' }}>กลาง</div></div>
            <div style={{ textAlign: 'center' }}><div className="price">฿{maxP}</div><div style={{ fontSize: 11, color: 'var(--ink3)' }}>สูงสุด</div></div>
            <div style={{ textAlign: 'center' }}><div className="price">{book.wanted_count || 0}</div><div style={{ fontSize: 11, color: 'var(--ink3)' }}>คนรอ</div></div>
          </div>
        )}

        <div className="section">
          <div className="section-title" style={{ marginBottom: 12 }}>{listings.length} คนกำลังขายอยู่</div>

          {listings.length === 0 && (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <div style={{ marginBottom: 16 }}>ยังไม่มีคนขายเล่มนี้</div>
              <Link href={`/sell?isbn=${isbn}`}>
                <button className="btn" style={{ maxWidth: 200, margin: '0 auto', display: 'block' }}>ลงขายเป็นรายแรก</button>
              </Link>
            </div>
          )}

          {listings.map(l => (
            <div key={l.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link href={`/seller/${l.seller_id}`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                      {l.users?.display_name}
                    </Link>
                    {l.users?.is_verified && <span className="badge badge-blue">✓ Verified</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>
                    ขายแล้ว {l.users?.sold_count || 0} · ยืนยัน {l.users?.confirmed_count || 0} ครั้ง
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="price">฿{l.price}</div>
                  <CondBadge cond={l.condition} />
                </div>
              </div>

              {l.photos?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto' }}>
                  {l.photos.filter(p => p).map((p, i) => (
                    <div key={i} style={{ width: 56, height: 56, borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{l.price_includes_shipping ? '✓ ส่งฟรี' : 'ผู้ซื้อจ่ายค่าส่ง'}</div>
                <button onClick={() => alert(`ติดต่อ: ${l.contact}`)} style={{ background: 'var(--primary)', border: 'none', borderRadius: 8, padding: '8px 16px', color: 'white', fontFamily: 'Sarabun', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  ติดต่อ
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 12 }} />
      </div>
      <BottomNav />
    </>
  )
}
