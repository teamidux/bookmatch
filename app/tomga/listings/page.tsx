'use client'
import { useState, useEffect } from 'react'

type L = {
  id: string
  book_id: string
  seller_id: string
  condition: string
  price: number
  contact: string
  notes: string | null
  photos: string[]
  status: string
  created_at: string
  flagged_words: string[]
  books: { title: string; author: string; isbn: string; cover_url: string | null } | null
  users: { display_name: string; line_id: string | null; phone: string | null } | null
}

export default function AdminListingsPage() {
  const [tab, setTab] = useState<'active' | 'flagged' | 'removed'>('active')
  const [q, setQ] = useState('')
  const [listings, setListings] = useState<L[]>([])
  const [loading, setLoading] = useState(true)
  const [removeTarget, setRemoveTarget] = useState<L | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ tab, q })
      const res = await fetch('/api/tomga/listings?' + params)
      const d = await res.json()
      setListings(d.listings || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [tab])
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [q])

  const remove = async () => {
    if (!removeTarget || !removeReason.trim()) return
    setActing(removeTarget.id)
    try {
      const res = await fetch('/api/tomga/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: removeTarget.id, action: 'remove', reason: removeReason.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        alert('ลบไม่สำเร็จ: ' + (d.error || 'unknown'))
        return
      }
      setRemoveTarget(null)
      setRemoveReason('')
      await load()
    } finally { setActing(null) }
  }

  const fmtDate = (dt: string) => {
    const mins = Math.floor((Date.now() - new Date(dt).getTime()) / 60000)
    if (mins < 60) return `${mins} นาที`
    if (mins < 1440) return `${Math.floor(mins / 60)} ชม.`
    return `${Math.floor(mins / 1440)} วัน`
  }

  return (
    <div style={{ padding: '24px 0 80px' }}>
      <h1 style={{ fontFamily: "'Kanit', sans-serif", fontSize: 28, fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: 6 }}>
        จัดการ Listings
      </h1>
      <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 0, marginBottom: 20 }}>
        ลบ listing ที่ไม่เหมาะสม + ระบบ flag เนื้อหาต้องห้ามอัตโนมัติ
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #E2E8F0' }}>
        {[
          { id: 'active', label: 'Active' },
          { id: 'flagged', label: '🚩 น่าสงสัย' },
          { id: 'removed', label: '🗑 ถูกลบ' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '3px solid #2563EB' : '3px solid transparent',
              padding: '10px 16px',
              fontFamily: 'Kanit',
              fontSize: 15,
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? '#2563EB' : '#64748B',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="🔍 ค้นหาชื่อหนังสือ / ISBN / ชื่อผู้ขาย"
        style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: 10, fontFamily: 'Kanit', fontSize: 15, marginBottom: 16, outline: 'none' }}
      />

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading...</div>}
      {!loading && listings.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#CBD5E1' }}>ไม่พบ listing</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {listings.map(l => (
          <div key={l.id} style={{
            background: 'white',
            border: `1px solid ${l.flagged_words.length ? '#FDE68A' : l.status === 'removed' ? '#E2E8F0' : '#E2E8F0'}`,
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            opacity: l.status === 'removed' ? 0.65 : 1,
          }}>
            <div style={{
              width: 56, height: 76, borderRadius: 6,
              background: l.photos[0] ? `url(${l.photos[0]}) center/cover` : (l.books?.cover_url ? `url(${l.books.cover_url}) center/cover` : '#F1F5F9'),
              flexShrink: 0, border: '1px solid #E2E8F0',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{l.books?.title || '(ไม่มีชื่อ)'}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>฿{l.price}</span>
                {l.status === 'removed' && <span style={{ background: '#F1F5F9', color: '#64748B', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>REMOVED</span>}
                {l.flagged_words.length > 0 && (
                  <span style={{ background: '#FEF3C7', color: '#B45309', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                    🚩 {l.flagged_words.join(', ')}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>
                {l.books?.author && <>{l.books.author} · </>}
                ISBN: {l.books?.isbn || '—'}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                ผู้ขาย: <b style={{ color: '#475569' }}>{l.users?.display_name || '—'}</b>
                {l.users?.line_id && <> · LINE: {l.users.line_id}</>}
                · {l.condition} · {fmtDate(l.created_at)}
              </div>
              {l.notes && (
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 6, padding: '6px 10px', background: '#F8FAFC', borderRadius: 6, maxHeight: 60, overflow: 'hidden' }}>
                  {l.notes}
                </div>
              )}
            </div>

            {l.status === 'active' && (
              <button
                onClick={() => { setRemoveTarget(l); setRemoveReason('') }}
                disabled={acting === l.id}
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Kanit', flexShrink: 0 }}
              >
                🗑 ลบ
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Remove confirm modal */}
      {removeTarget && (
        <div onClick={() => setRemoveTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, padding: '24px 24px 20px', width: '100%', maxWidth: 480 }}>
            <div style={{ fontFamily: 'Kanit', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>🗑 ลบ Listing</div>
            <div style={{ fontSize: 14, color: '#64748B', marginBottom: 14 }}>
              <b style={{ color: '#0F172A' }}>{removeTarget.books?.title}</b><br />
              ผู้ขาย: {removeTarget.users?.display_name}
            </div>

            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#7F1D1D', lineHeight: 1.7, marginBottom: 14 }}>
              <b>จะเกิดอะไรขึ้น:</b><br />
              • Listing → status='removed' (ซ่อนจากระบบ)<br />
              • <b>Seller จะได้รับ LINE notify</b> พร้อมเหตุผล<br />
              • Action ถูกบันทึกใน audit log<br />
              • Reversible: edit ใน DB กลับเป็น 'active' ได้ถ้าผิดพลาด
            </div>

            <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
              เหตุผล (จะส่งให้ seller)
            </label>
            <textarea
              value={removeReason}
              onChange={e => setRemoveReason(e.target.value)}
              placeholder="เช่น: เนื้อหาไม่เหมาะสม / ละเมิดลิขสิทธิ์ / ราคาผิดปกติ"
              rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontFamily: 'Kanit', fontSize: 14, outline: 'none', resize: 'vertical', marginBottom: 14 }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setRemoveTarget(null)}
                style={{ flex: 1, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px', fontFamily: 'Kanit', fontWeight: 600, color: '#64748B', cursor: 'pointer', fontSize: 14 }}
              >
                ยกเลิก
              </button>
              <button
                onClick={remove}
                disabled={!removeReason.trim() || acting === removeTarget.id}
                style={{
                  flex: 2,
                  background: '#DC2626',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px',
                  color: 'white',
                  fontFamily: 'Kanit',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 14,
                  opacity: !removeReason.trim() || acting === removeTarget.id ? 0.5 : 1,
                }}
              >
                {acting === removeTarget.id ? 'กำลังลบ...' : 'ลบ Listing นี้'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
