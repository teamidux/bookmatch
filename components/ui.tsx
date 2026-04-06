'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'

export function Nav() {
  const { user } = useAuth()
  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">BookMatch</Link>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link href="/sell">
          <button className="btn btn-sm" style={{ width: 'auto' }}>
            {user ? '+ ลงขาย' : 'เข้าสู่ระบบ / ลงขาย'}
          </button>
        </Link>
      </div>
    </nav>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const tabs = [
    { href: '/', icon: '🏠', label: 'หน้าแรก' },
    { href: '/sell', icon: '📚', label: 'ลงขาย' },
    { href: '/wanted', icon: '🔔', label: 'Wanted' },
    { href: '/profile', icon: '👤', label: 'โปรไฟล์' },
  ]
  return (
    <div className="bottom-nav">
      {tabs.map(t => (
        <Link
          key={t.href}
          href={t.href}
          className={`bnav-item ${pathname === t.href ? 'active' : ''}`}
        >
          <span>{t.icon}</span>
          <span>{t.label}</span>
        </Link>
      ))}
    </div>
  )
}

export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null
  return <div className="toast">{msg}</div>
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  const show = (m: string, ms = 2500) => {
    setMsg(m)
    setTimeout(() => setMsg(null), ms)
  }
  return { msg, show }
}

export function BookCover({
  coverUrl,
  title,
  size = 52,
}: {
  coverUrl?: string
  title?: string
  size?: number
}) {
  return (
    <div
      className="book-cover"
      style={{ width: size, height: size * 1.4 }}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <span style={{ fontSize: size * 0.4 }}>📗</span>
      )}
    </div>
  )
}

export function InAppBanner() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const ua = navigator.userAgent
    if (/FBAN|FBAV|Instagram|Line\//.test(ua)) setShow(true)
  }, [])
  if (!show) return null
  return (
    <div className="inapp-banner">
      <span>⚠️</span>
      <div style={{ flex: 1 }}>
        <strong>เปิดใน Chrome</strong> เพื่อใช้กล้องสแกน ISBN ได้
      </div>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(window.location.href)
          setShow(false)
        }}
        style={{
          background: '#D97706',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          padding: '5px 10px',
          fontFamily: 'Sarabun',
          fontWeight: 700,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Copy Link
      </button>
    </div>
  )
}

export function CondBadge({ cond }: { cond: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    new: { cls: 'badge-new', label: '✨ ใหม่มาก' },
    good: { cls: 'badge-good', label: '👍 ดี' },
    fair: { cls: 'badge-fair', label: '📖 พอใช้' },
  }
  const { cls, label } = map[cond] || map.good
  return <span className={`badge ${cls}`}>{label}</span>
}

export function LoginModal({
  onClose,
  onDone,
}: {
  onClose: () => void
  onDone: () => void
}) {
  const { login } = useAuth()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const { msg, show } = useToast()

  const handleLogin = async () => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 9) {
      show('กรุณากรอกเบอร์มือถือ')
      return
    }
    setLoading(true)
    await login(cleaned)
    setLoading(false)
    onDone()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.6)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '18px 18px 0 0',
          padding: '24px 20px 40px',
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        <Toast msg={msg} />
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 20,
            marginBottom: 4,
          }}
        >
          เข้าสู่ระบบ
        </div>
        <div
          style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 20 }}
        >
          ใส่เบอร์มือถือเพื่อลงขาย
        </div>
        <div className="form-group">
          <label className="label">เบอร์มือถือ</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1.5px solid var(--border)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--ink2)',
              }}
            >
              🇹🇭 +66
            </div>
            <input
              className="input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081 234 5678"
              maxLength={10}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </div>
        <button
          className="btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading && <span className="spin" />}
          เข้าสู่ระบบ
        </button>
        <button
          className="btn btn-ghost"
          style={{ marginTop: 8 }}
          onClick={onClose}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  )
}

const SCAN_TIPS = [
  { icon: '📖', text: 'ถ่ายบาร์โค้ดหลังปก ไม่ใช่หน้าปก' },
  { icon: '☀️', text: 'ถ่ายในที่แสงสว่างเพียงพอ' },
  { icon: '🔍', text: 'เข้าใกล้บาร์โค้ดให้พอดี อย่าห่างหรือชิดเกินไป' },
  { icon: '🧹', text: 'เช็ดทำความสะอาดเลนส์กล้องก่อนถ่าย' },
  { icon: '🤚', text: 'ถือมือให้นิ่ง รอให้กล้องโฟกัสก่อนถ่าย' },
]

export function ScanErrorSheet({ onRetry, onClose }: { onRetry: () => void; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '18px 18px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18 }}>อ่านบาร์โค้ดไม่ได้</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink3)', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 16 }}>ลองตรวจสอบสิ่งเหล่านี้แล้วถ่ายใหม่</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {SCAN_TIPS.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', borderRadius: 10, padding: '10px 14px' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
              <span style={{ fontSize: 14 }}>{t.text}</span>
            </div>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: 'var(--primary)', border: 'none', borderRadius: 12, padding: '13px 16px', color: 'white', fontFamily: 'Sarabun', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          onClick={onRetry}>
          📷 ถ่ายใหม่อีกครั้ง
        </label>
      </div>
    </div>
  )
}
