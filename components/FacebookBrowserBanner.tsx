'use client'
import { useEffect, useState } from 'react'

// Facebook in-app browser → banner เชิญ user เปิดใน Chrome/Safari
// เหตุผล: FB browser รัน camera/scan barcode ไม่เสถียร + login OAuth ล้มบ่อย
//
// ต่างจาก LineBrowserBanner ตรงที่:
// - FB browser ไม่ broken เท่า LINE → ใช้ banner เล็กแทน full-screen modal
// - Android มี intent:// scheme เปิด Chrome ได้
// - iOS จำกัด — ต้องให้ user กด ••• → Open in Safari เอง
export default function FacebookBrowserBanner() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android'>('android')

  useEffect(() => {
    if (typeof window === 'undefined') return
    // dismiss ไว้แล้ว — ไม่โชว์อีกใน session นี้
    if (sessionStorage.getItem('bm_fb_banner_dismissed') === '1') return
    const ua = navigator.userAgent
    // FB in-app browser signatures
    const isFB = /FBAN\/|FBAV\/|FBIOS|FB_IAB|FB4A/.test(ua)
    if (!isFB) return
    const isIOS = /iPhone|iPad|iPod/.test(ua)
    setPlatform(isIOS ? 'ios' : 'android')
    setVisible(true)
  }, [])

  const openExternal = () => {
    const url = window.location.href

    if (platform === 'android') {
      // Android FB: intent:// เรียก Chrome ตรง = เวิร์ก 100%
      window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
      return
    }

    // iOS FB: ไม่มี scheme ที่เปิด Safari ตรงได้ (iOS 14+ บล็อก x-safari-https)
    // วิธีเดียวคือ user ต้องกด ••• → Open in Safari เอง
    // Copy URL ให้ + แจ้งวิธี
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert('คัดลอกลิงก์แล้ว ✓\n\n1. เปิด Safari\n2. แตะช่อง URL\n3. วาง (Paste) + Go')
      }).catch(() => {
        alert('กดปุ่ม ••• (มุมขวาล่าง) แล้วเลือก "Open in Safari"')
      })
    } else {
      alert('กดปุ่ม ••• (มุมขวาล่าง) แล้วเลือก "Open in Safari"')
    }
  }

  const dismiss = () => {
    setVisible(false)
    try { sessionStorage.setItem('bm_fb_banner_dismissed', '1') } catch {}
  }

  if (!visible) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1877F2 0%, #0C63D4 100%)',
      color: 'white',
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 13,
      lineHeight: 1.4,
      fontFamily: "'Kanit', sans-serif",
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          เปิดใน {platform === 'ios' ? 'Safari' : 'Chrome'}
        </div>
        <div style={{ fontSize: 13, opacity: .9, marginTop: 2 }}>
          ใน Facebook browser สแกน barcode และถ่ายรูปไม่ได้
        </div>
      </div>
      <button
        onClick={openExternal}
        style={{
          background: 'white',
          color: '#0C63D4',
          border: 'none',
          borderRadius: 8,
          padding: '8px 14px',
          minHeight: 44,
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'Kanit',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        เปิด
      </button>
      <button
        onClick={dismiss}
        aria-label="ปิด"
        style={{
          background: 'rgba(255,255,255,.15)',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          width: 40,
          height: 40,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ✕
      </button>
    </div>
  )
}
