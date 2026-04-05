'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, Wanted } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Nav, BottomNav, BookCover, LoginModal, useToast, Toast } from '@/components/ui'

export default function WantedPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Wanted[]>([])
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(true)
  const { msg, show } = useToast()

  useEffect(() => {
    if (user) load()
    else setLoading(false)
  }, [user])

  const load = async () => {
    if (!user) return
    const { data } = await supabase
      .from('wanted')
      .select('*, books(isbn, title, author, cover_url, active_listings_count, min_price)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  const remove = async (id: string) => {
    await supabase.from('wanted').delete().eq('id', id)
    setItems(prev => prev.filter(w => w.id !== id))
    show('ลบออกจาก Wanted List แล้ว')
  }

  if (!user) return (
    <>
      <Nav />
      <div style={{ padding: '48px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Wanted List</div>
        <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 24 }}>เข้าสู่ระบบเพื่อเพิ่มหนังสือที่ต้องการ</div>
        <button className="btn" style={{ maxWidth: 200, margin: '0 auto' }} onClick={() => setShowLogin(true)}>เข้าสู่ระบบ</button>
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onDone={() => setShowLogin(false)} />}
      <BottomNav />
    </>
  )

  return (
    <>
      <Nav />
      <Toast msg={msg} />
      <div className="page">
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, marginBottom: 4 }}>Wanted List</div>
          <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 16 }}>เราจะแจ้งเตือนเมื่อมีคนลงขายหนังสือที่คุณต้องการ</div>

          {loading && <div style={{ textAlign: 'center', padding: 32 }}><span className="spin" style={{ width: 24, height: 24 }} /></div>}

          {!loading && items.length === 0 && (
            <div className="empty">
              <div className="empty-icon">🔔</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>ยังไม่มีรายการ</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>ค้นหาหนังสือที่อยากได้แล้วกด "ต้องการเล่มนี้"</div>
              <Link href="/"><button className="btn" style={{ maxWidth: 200, margin: '0 auto', display: 'block' }}>ค้นหาหนังสือ</button></Link>
            </div>
          )}

          {items.map(w => {
            const hasStock = (w.books?.active_listings_count || 0) > 0
            return (
              <div key={w.id} className="card" style={{ position: 'relative' }}>
                <Link href={`/book/${w.books?.isbn || w.isbn}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <BookCover coverUrl={w.books?.cover_url} title={w.books?.title} size={52} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="book-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.books?.title}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {w.max_price && <span style={{ fontSize: 12, color: 'var(--ink3)' }}>สูงสุด <strong style={{ color: 'var(--primary)' }}>฿{w.max_price}</strong></span>}
                        {hasStock
                          ? <span className="badge badge-green">✓ มีคนขาย {w.books?.active_listings_count} ราย</span>
                          : <span className="badge" style={{ background: '#FFF8E1', color: '#E65100' }}>รอคอยอยู่</span>
                        }
                      </div>
                    </div>
                  </div>
                </Link>
                <button onClick={() => remove(w.id)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: 'var(--ink3)', fontSize: 16, cursor: 'pointer', padding: 4 }}>✕</button>
              </div>
            )
          })}
        </div>
        <div style={{ height: 12 }} />
      </div>
      <BottomNav />
    </>
  )
}
