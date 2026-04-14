'use client'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth'
import type { User } from '@/lib/supabase'

// Smart single-button opt-in สำหรับ LINE notification
// - State 1 (ยังไม่เชื่อม LINE): ปุ่ม "เริ่มเลย" → LINE OAuth (พ่วง add OA)
// - State 2 (เชื่อม LINE แล้ว แต่ไม่ add OA): ปุ่ม "Add" → deeplink LINE
// - State 3 (ครบแล้ว): ซ่อน
// - ซ่อนใน FB browser + iPhone Chrome (LINE OAuth ใช้ไม่ได้)

export default function LineAlertOptin({ user, nextPath = '/notifications' }: { user: User | null; nextPath?: string }) {
  const [blocked, setBlocked] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { reloadUser } = useAuth()

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    const ua = navigator.userAgent
    // FB browser → LINE OAuth ใช้ไม่ได้
    if (/FBAN|FBAV/.test(ua)) { setBlocked(true); return }
    // iPhone Chrome → Apple บังคับ Safari สำหรับ LINE OAuth
    if (/CriOS/.test(ua)) { setBlocked(true); return }
  }, [])

  // ref sync กับ user state — กัน stale closure ใน interval
  const friendNowRef = useRef<boolean>(!!(user as any)?.line_oa_friend_at)
  useEffect(() => {
    friendNowRef.current = !!(user as any)?.line_oa_friend_at
  }, [user])

  const checkAndReload = async () => {
    if (friendNowRef.current) return // เป็นเพื่อนแล้ว ไม่ต้องเช็คอีก
    try {
      const r = await fetch('/api/line/check-friendship', { method: 'POST' })
      const data = await r.json().catch(() => ({}))
      if (data.isFriend) {
        // เพิ่งเป็นเพื่อน → โชว์ success + reload
        friendNowRef.current = true
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 4000)
        await reloadUser()
      }
    } catch {}
  }

  // เช็ค: mount + focus + visibility + poll ทุก 3 วิ (หยุดเมื่อเป็นเพื่อน)
  useEffect(() => {
    if (friendNowRef.current) return // ครบแล้วไม่ต้อง setup
    checkAndReload()
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkAndReload()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', checkAndReload)
    const interval = setInterval(() => {
      if (friendNowRef.current) { clearInterval(interval); return }
      checkAndReload()
    }, 3000)
    const stopPolling = setTimeout(() => clearInterval(interval), 60000) // 60 วิพอ
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', checkAndReload)
      clearInterval(interval)
      clearTimeout(stopPolling)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user || blocked) return null

  const hasLineLinked = !!(user as any).line_user_id
  const hasLineFriend = !!(user as any).line_oa_friend_at

  // State 3: ครบแล้ว → แสดง success banner ชั่วคราว (4 วิ) แล้วค่อยซ่อน
  if (hasLineLinked && hasLineFriend) {
    if (!showSuccess) return null
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 12,
        padding: '14px 16px', marginTop: 20,
        animation: 'fadeInBanner .3s ease',
      }}>
        <span style={{ fontSize: 24 }}>✅</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#15803D' }}>พร้อมรับแจ้งเตือนทาง LINE แล้ว!</div>
          <div style={{ fontSize: 13, color: '#16A34A', marginTop: 2 }}>เมื่อมีคนสนใจหรือหนังสือที่ตามหามีคนขาย เราจะแจ้งคุณทาง LINE</div>
        </div>
        <style>{`@keyframes fadeInBanner { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    )
  }

  const oaId = process.env.NEXT_PUBLIC_LINE_OA_BASIC_ID || '@521qvzrv'

  // State 2: เชื่อมแล้ว แต่ยังไม่ add OA
  if (hasLineLinked && !hasLineFriend) {
    return (
      <a
        href={`https://line.me/R/ti/p/${oaId}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12,
          padding: '14px 16px', marginTop: 20, textDecoration: 'none', color: 'inherit',
        }}
      >
        <span style={{ fontSize: 24 }}>💚</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Add @BookMatch เป็นเพื่อน</div>
          <div style={{ fontSize: 13, color: '#15803D', marginTop: 2 }}>อีกขั้นเดียวจะได้รับแจ้งเตือนทาง LINE</div>
        </div>
        <span style={{
          background: '#06C755', color: 'white', borderRadius: 8,
          padding: '8px 14px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
        }}>Add →</span>
      </a>
    )
  }

  // State 1: ยังไม่เชื่อม LINE เลย → LINE OAuth (bot_prompt=aggressive จะพ่วง add OA ด้วย)
  return (
    <a
      href={`/api/auth/line/start?next=${encodeURIComponent(nextPath)}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12,
        padding: '14px 16px', marginTop: 20, textDecoration: 'none', color: 'inherit',
      }}
    >
      <span style={{ fontSize: 24 }}>💚</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>รับแจ้งเตือนทาง LINE</div>
        <div style={{ fontSize: 13, color: '#15803D', marginTop: 2 }}>bonus — ไม่ต้องเปิดเว็บก็รู้</div>
      </div>
      <span style={{
        background: '#06C755', color: 'white', borderRadius: 8,
        padding: '8px 14px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
      }}>เริ่มเลย →</span>
    </a>
  )
}
