'use client'
import { useState, useEffect } from 'react'

type A = {
  id: string
  action: string
  target_type: string
  target_id: string
  reason: string | null
  metadata: any
  created_at: string
  admin: { display_name: string } | null
}

const ACTION_META: Record<string, { icon: string; label: string; color: string }> = {
  ban_user: { icon: '🛑', label: 'Ban user', color: '#DC2626' },
  unban_user: { icon: '↩️', label: 'Unban user', color: '#16A34A' },
  soft_delete_user: { icon: '🗑', label: 'ลบ user', color: '#64748B' },
  delete_avatar_user: { icon: '🖼️', label: 'ลบรูป profile', color: '#B45309' },
  remove_listing: { icon: '📦', label: 'ลบ listing', color: '#DC2626' },
  edit_book: { icon: '📖', label: 'แก้ข้อมูลหนังสือ', color: '#2563EB' },
  approve_verify: { icon: '✅', label: 'อนุมัติ verify', color: '#16A34A' },
  reject_verify: { icon: '❌', label: 'ปฏิเสธ verify', color: '#DC2626' },
}

export default function AdminAuditPage() {
  const [actions, setActions] = useState<A[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(filter ? { action: filter } : {})
      const res = await fetch('/api/tomga/audit?' + params)
      const d = await res.json()
      setActions(d.actions || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const fmtDate = (dt: string) => {
    const d = new Date(dt)
    return d.toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ padding: '24px 0 80px' }}>
      <h1 style={{ fontFamily: "'Kanit', sans-serif", fontSize: 28, fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: 6 }}>
        Audit Log
      </h1>
      <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 0, marginBottom: 20 }}>
        ประวัติการทำงานของ admin — สำหรับ review, debug, ตอบ PDPA request
      </p>

      <select
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontFamily: 'Kanit', fontSize: 14, marginBottom: 16, outline: 'none', background: 'white' }}
      >
        <option value="">ทุก action</option>
        {Object.entries(ACTION_META).map(([k, v]) => (
          <option key={k} value={k}>{v.icon} {v.label}</option>
        ))}
      </select>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading...</div>}
      {!loading && actions.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#CBD5E1' }}>ยังไม่มี log</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.map(a => {
          const meta = ACTION_META[a.action] || { icon: '•', label: a.action, color: '#64748B' }
          return (
            <div key={a.id} style={{
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}>
              <div style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{meta.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>โดย {a.admin?.display_name || '—'}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94A3B8' }}>{fmtDate(a.created_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                  Target: <code style={{ fontSize: 11, background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>{a.target_type}/{a.target_id.slice(0, 8)}</code>
                </div>
                {a.reason && (
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4, fontStyle: 'italic' }}>
                    "{a.reason}"
                  </div>
                )}
                {a.metadata && Object.keys(a.metadata).length > 0 && (
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3, fontFamily: 'monospace' }}>
                    {JSON.stringify(a.metadata)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
