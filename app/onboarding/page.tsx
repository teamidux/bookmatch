'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Nav, useToast, Toast } from '@/components/ui'
import { parseLineId } from '@/lib/line-id'

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, updateUser } = useAuth()
  const { msg, show } = useToast()
  const [lineInput, setLineInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const next = searchParams.get('next') || '/'

  // ถ้า user มี line_id อยู่แล้ว (ไม่ใช่ first login) → redirect ออก
  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/')
      return
    }
    if (user.line_id) {
      router.replace(next)
    }
  }, [user, loading, next, router])

  const handleSave = async () => {
    setError('')
    const parsed = parseLineId(lineInput)
    if (!parsed) {
      setError('LINE ID ต้องเป็น 4-20 ตัวอักษร (a-z, 0-9, จุด ขีด ขีดเส้นใต้)')
      return
    }
    setSaving(true)
    try {
      await updateUser({ line_id: parsed.raw } as any)
      show('บันทึกแล้ว ✓')
      setTimeout(() => router.replace(next), 600)
    } catch (e: any) {
      setError(e?.message || 'บันทึกไม่สำเร็จ')
      setSaving(false)
    }
  }

  const handleSkip = () => {
    router.replace(next)
  }

  if (loading || !user) return (
    <>
      <Nav />
      <div style={{ padding: 60, textAlign: 'center' }}>
        <span className="spin" style={{ width: 28, height: 28 }} />
      </div>
    </>
  )

  return (
    <>
      <Nav />
      <Toast msg={msg} />
      <div className="page" style={{ paddingTop: 24 }}>
        <div style={{ maxWidth: 440, margin: '0 auto', padding: '0 20px' }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💚</div>
            <div style={{ fontFamily: "'Kanit', sans-serif", fontSize: 22, fontWeight: 700, color: '#121212', lineHeight: 1.3, marginBottom: 8 }}>
              เพิ่ม LINE ID ของคุณ
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink3)', lineHeight: 1.6 }}>
              เพื่อให้ผู้ซื้อ add LINE คุณได้ทันที<br />
              ไม่ต้องกรอกซ้ำทุกครั้งที่ลงขาย
            </div>
          </div>

          {/* Form */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)', display: 'block', marginBottom: 8 }}>
              LINE ID ของคุณ
            </label>
            <input
              className="input"
              type="text"
              value={lineInput}
              onChange={(e) => { setLineInput(e.target.value); setError('') }}
              placeholder="เช่น somchai_books หรือ @bookshop"
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', fontSize: 16 }}
            />
            <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 8, lineHeight: 1.5 }}>
              💡 หา LINE ID ของคุณได้ที่: LINE app → Home → Settings → Profile → ID
            </div>
            {error && (
              <div style={{ fontSize: 13, color: 'var(--red)', marginTop: 8 }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          <button
            className="btn"
            onClick={handleSave}
            disabled={saving || !lineInput.trim()}
            style={{ marginBottom: 10 }}
          >
            {saving ? 'กำลังบันทึก...' : '✓ บันทึก'}
          </button>

          <button
            className="btn btn-ghost"
            onClick={handleSkip}
            disabled={saving}
          >
            ข้ามไปก่อน
          </button>

          <div style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            ตั้งค่าภายหลังได้ที่หน้า Profile
          </div>
        </div>
      </div>
    </>
  )
}
