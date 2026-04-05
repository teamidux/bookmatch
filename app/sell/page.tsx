'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, fetchBookByISBN, Book } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Nav, BottomNav, BookCover, LoginModal, InAppBanner, useToast, Toast } from '@/components/ui'

const CONDITIONS = [
  { key: 'new', label: '✨ ใหม่มาก' },
  { key: 'good', label: '👍 ดี' },
  { key: 'fair', label: '📖 พอใช้' },
]

type Photo = { id: string; label: string; preview?: string }

const PHOTO_SLOTS = [
  { id: 'cover', label: 'หน้าปก', required: true },
  { id: 'p2', label: 'รูปที่ 2', required: false },
  { id: 'p3', label: 'รูปที่ 3', required: false },
  { id: 'p4', label: 'รูปที่ 4', required: false },
  { id: 'p5', label: 'รูปที่ 5', required: false },
]

export default function SellPageWrapper() {
  return (
    <Suspense fallback={
      <><Nav /><div style={{ textAlign: 'center', padding: 60 }}><span className="spin" style={{ width: 28, height: 28 }} /></div></>
    }>
      <SellPage />
    </Suspense>
  )
}

function SellPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { msg, show } = useToast()

  const [showLogin, setShowLogin] = useState(false)
  const [isbn, setIsbn] = useState(searchParams.get('isbn') || '')
  const [fetchedBook, setFetchedBook] = useState<Partial<Book> | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [cond, setCond] = useState('good')
  const [price, setPrice] = useState('')
  const [shipping, setShipping] = useState('buyer')
  const [contact, setContact] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [marketPrice, setMarketPrice] = useState<{ min: number; max: number; avg: number } | null>(null)
  const [manualTitle, setManualTitle] = useState('')
  const [manualAuthor, setManualAuthor] = useState('')

  const scannerRef = useRef<any>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    if (user?.phone) setContact(user.phone)
    const isbnParam = searchParams.get('isbn')
    if (isbnParam) fetchBook(isbnParam)
  }, [user])

  const fetchBook = async (isbnVal?: string) => {
    const q = (isbnVal || isbn).trim()
    if (!q) { show('กรุณากรอก ISBN'); return }
    setFetching(true)
    setNotFound(false)
    const book = await fetchBookByISBN(q)
    if (book?.title) {
      setFetchedBook(book)
      if ((book as any).id) {
        const { data: ls } = await supabase.from('listings').select('price').eq('book_id', (book as any).id).eq('status', 'active')
        if (ls?.length) {
          const prices = ls.map((l: any) => l.price)
          setMarketPrice({ min: Math.min(...prices), max: Math.max(...prices), avg: Math.round(prices.reduce((a: number, b: number) => a + b) / prices.length) })
        }
      }
    } else {
      setNotFound(true)
    }
    setFetching(false)
  }

  const startScan = async () => {
    if (!user) { setShowLogin(true); return }
    setScanning(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('sell-scanner')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 100 } },
        (text: string) => { scanner.stop(); setScanning(false); setIsbn(text); fetchBook(text) },
        () => {}
      )
    } catch { setScanning(false); show('ไม่สามารถเปิดกล้องได้ กรุณาเปิดใน Chrome') }
  }

  const stopScan = () => { scannerRef.current?.stop(); setScanning(false) }

  const handleFileChange = (slotId: string, label: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setPhotos(prev => [...prev.filter(p => p.id !== slotId), { id: slotId, label, preview }])
  }

  const removePhoto = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotos(prev => prev.filter(p => p.id !== slotId))
    if (fileRefs.current[slotId]) fileRefs.current[slotId]!.value = ''
  }

  const submit = async () => {
    if (!user) { setShowLogin(true); return }
    if (!fetchedBook?.title && !manualTitle) { show('กรุณาดึงข้อมูลหนังสือก่อน'); return }
    if (!photos.find(p => p.id === 'cover')) { show('กรุณาใส่รูปหน้าปก'); return }
    if (!price || isNaN(parseFloat(price))) { show('กรุณาใส่ราคา'); return }
    if (!contact.trim()) { show('กรุณาใส่ช่องทางติดต่อ'); return }

    setSubmitting(true)
    show('กำลังบันทึก...')

    try {
      const currentIsbn = (fetchedBook as any)?.isbn || isbn
      let bookId = (fetchedBook as any)?.id

      if (!bookId) {
        const { data: existing } = await supabase.from('books').select('id').eq('isbn', currentIsbn).maybeSingle()
        if (existing?.id) {
          bookId = existing.id
        } else {
          const { data: newBook, error: bookErr } = await supabase.from('books').insert({
            isbn: currentIsbn,
            title: fetchedBook?.title || manualTitle,
            author: fetchedBook?.author || manualAuthor || '',
            cover_url: fetchedBook?.cover_url || '',
            language: fetchedBook?.language || 'th',
            first_contributor_id: user.id,
            source: 'community',
          }).select().single()
          if (bookErr) throw new Error(bookErr.message)
          bookId = newBook.id
        }
      }

      const { error: listErr } = await supabase.from('listings').insert({
        book_id: bookId,
        seller_id: user.id,
        condition: cond,
        price: parseFloat(price),
        price_includes_shipping: shipping === 'free',
        contact: contact.trim(),
        photos: photos.map(p => p.preview || ''),
        status: 'active',
      })
      if (listErr) throw new Error(listErr.message)

      show('ลงขายเรียบร้อยแล้ว 🎉')
      setTimeout(() => router.push(`/book/${currentIsbn}`), 1500)
    } catch (e: any) {
      show('❌ ' + (e.message || 'เกิดข้อผิดพลาด'))
    }
    setSubmitting(false)
  }

  return (
    <>
      <Nav />
      <InAppBanner />
      <Toast msg={msg} />
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onDone={() => setShowLogin(false)} />}

      <div className="page">
        <div style={{ padding: '16px 16px 80px' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, marginBottom: 16 }}>ลงขายหนังสือ</div>

          {!user && (
            <div style={{ background: 'var(--primary-light)', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, color: 'var(--primary-dark)' }}>เข้าสู่ระบบเพื่อลงขาย</div>
              <button className="btn btn-sm" style={{ width: 'auto' }} onClick={() => setShowLogin(true)}>เข้าสู่ระบบ</button>
            </div>
          )}

          {scanning ? (
            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 14, position: 'relative' }}>
              <div id="sell-scanner" />
              <button onClick={stopScan} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.6)', border: 'none', borderRadius: 20, padding: '5px 12px', color: 'white', fontFamily: 'Sarabun', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>✕ ปิด</button>
            </div>
          ) : !fetchedBook && (
            <div onClick={startScan} style={{ background: 'var(--surface)', border: '2px dashed #BFDBFE', borderRadius: 14, padding: '24px 20px', textAlign: 'center', marginBottom: 14, cursor: 'pointer' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary)' }}>สแกน Barcode</div>
              <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 4 }}>แตะเพื่อเปิดกล้อง</div>
            </div>
          )}

          {!fetchedBook && (
            <div className="form-group">
              <label className="label">ISBN</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" value={isbn} onChange={e => setIsbn(e.target.value)} placeholder="เช่น 9780747532743" onKeyDown={e => e.key === 'Enter' && fetchBook()} />
                <button onClick={() => fetchBook()} disabled={fetching} style={{ background: 'var(--primary)', border: 'none', borderRadius: 10, padding: '0 16px', color: 'white', fontFamily: 'Sarabun', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {fetching ? <span className="spin" /> : 'ดึงข้อมูล'}
                </button>
              </div>
            </div>
          )}

          {notFound && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 12 }}>ไม่พบข้อมูล ISBN นี้ กรอกชื่อหนังสือเองได้เลย 🏆</div>
              <div className="form-group">
                <label className="label">ชื่อหนังสือ *</label>
                <input className="input" value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="ชื่อหนังสือ" />
              </div>
              <div className="form-group">
                <label className="label">ผู้แต่ง</label>
                <input className="input" value={manualAuthor} onChange={e => setManualAuthor(e.target.value)} placeholder="ผู้แต่ง (ไม่บังคับ)" />
              </div>
              {manualTitle && <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>🏆 คุณจะได้รับ Pioneer Badge!</div>}
            </div>
          )}

          {fetchedBook?.title && (
            <div style={{ background: 'var(--green-bg)', border: '1px solid #BBF7D0', borderLeft: '3px solid var(--green)', borderRadius: 12, padding: 13, display: 'flex', gap: 12, marginBottom: 14 }}>
              <BookCover coverUrl={fetchedBook.cover_url} title={fetchedBook.title} size={44} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{fetchedBook.title}</div>
                {fetchedBook.author && <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>{fetchedBook.author}</div>}
                <span style={{ fontSize: 11, background: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: 20, fontWeight: 700, display: 'inline-block', marginTop: 5 }}>✓ ดึงข้อมูลสำเร็จ</span>
              </div>
            </div>
          )}

          {(fetchedBook?.title || (notFound && manualTitle)) && (
            <>
              <div className="form-group">
                <label className="label">ภาพหนังสือ <span style={{ color: 'var(--red)' }}>*</span> <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink3)' }}>บังคับ 1 รูป เพิ่มได้ 5 รูป</span></label>
                <div className="photo-row">
                  {PHOTO_SLOTS.map(slot => {
                    const photo = photos.find(p => p.id === slot.id)
                    return (
                      <div key={slot.id}>
                        <input type="file" accept="image/*" capture="environment"
                          ref={el => { fileRefs.current[slot.id] = el }}
                          onChange={e => handleFileChange(slot.id, slot.label, e)}
                          style={{ display: 'none' }} />
                        <div className={`photo-slot ${slot.required ? 'required' : ''} ${photo ? 'filled' : ''}`}
                          onClick={() => { if (!user) { setShowLogin(true); return }; fileRefs.current[slot.id]?.click() }}>
                          {photo?.preview ? (
                            <>
                              <img src={photo.preview} alt="" />
                              <button onClick={e => removePhoto(slot.id, e)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,.5)', border: 'none', borderRadius: '50%', width: 18, height: 18, color: 'white', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>✕</button>
                            </>
                          ) : (
                            <><span>{slot.required ? '📷' : '+'}</span><span className="slot-label">{slot.label}</span></>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {!photos.find(p => p.id === 'cover') && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>⚠ กรุณาใส่รูปหน้าปก</div>}
              </div>

              <div className="form-group">
                <label className="label">สภาพหนังสือ</label>
                <div style={{ display: 'flex', gap: 7 }}>
                  {CONDITIONS.map(c => (
                    <button key={c.key} onClick={() => setCond(c.key)} style={{ flex: 1, padding: '10px 6px', border: `1.5px solid ${cond === c.key ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 10, background: cond === c.key ? 'var(--primary-light)' : 'white', fontFamily: 'Sarabun', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: cond === c.key ? 'var(--primary-dark)' : 'var(--ink2)' }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 13 }}>
                {marketPrice && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--ink3)' }}>ราคากลางในระบบ</div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>฿{marketPrice.min}–฿{marketPrice.max}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink3)' }}>แนะนำ ฿{marketPrice.avg}</div>
                    </div>
                  </div>
                )}
                <label className="label">ราคาขาย (บาท)</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink3)' }}>฿</span>
                  <input className="input" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="150" />
                </div>
              </div>

              <div className="form-group">
                <label className="label">ค่าส่ง</label>
                <select className="input" value={shipping} onChange={e => setShipping(e.target.value)}>
                  <option value="buyer">ผู้ซื้อจ่ายค่าส่ง</option>
                  <option value="free">ส่งฟรี (รวมในราคา)</option>
                  <option value="negotiate">ตกลงกันเอง</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">ช่องทางติดต่อ</label>
                <input className="input" value={contact} onChange={e => setContact(e.target.value)} placeholder="เบอร์โทร หรือ Line ID" />
              </div>

              <button className="btn" onClick={submit} disabled={submitting} style={{ marginTop: 8 }}>
                {submitting ? <><span className="spin" />กำลังบันทึก...</> : 'ลงประกาศขาย 🎉'}
              </button>
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  )
}
