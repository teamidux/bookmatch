import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { listingId, sellerId, action } = await req.json()
  // action: 'sold' | 'reactivate' | 'remove'
  if (!listingId || !sellerId || !action) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const sb = getSupabase()

  // ตรวจว่า listing นั้นเป็นของ seller จริง
  const { data: listing } = await sb
    .from('listings')
    .select('id, status, sold_at, seller_id')
    .eq('id', listingId)
    .eq('seller_id', sellerId)
    .maybeSingle()

  if (!listing) return NextResponse.json({ error: 'listing not found' }, { status: 404 })

  const { data: sellerRow } = await sb
    .from('users')
    .select('sold_count')
    .eq('id', sellerId)
    .single()
  const currentCount: number = sellerRow?.sold_count || 0

  if (action === 'sold') {
    if (listing.status === 'sold') return NextResponse.json({ ok: true })

    await sb.from('listings').update({ status: 'sold', sold_at: new Date().toISOString() }).eq('id', listingId)
    await sb.from('users').update({ sold_count: currentCount + 1 }).eq('id', sellerId)
    return NextResponse.json({ ok: true, sold_count: currentCount + 1 })
  }

  if (action === 'reactivate') {
    if (!listing.sold_at) return NextResponse.json({ error: 'no sold_at' }, { status: 400 })
    if (Date.now() - new Date(listing.sold_at).getTime() > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'ไม่สามารถเปิดคืนได้หลัง 24 ชั่วโมง' }, { status: 400 })
    }
    if (listing.status !== 'sold') return NextResponse.json({ ok: true })

    await sb.from('listings').update({ status: 'active', sold_at: null }).eq('id', listingId)
    await sb.from('users').update({ sold_count: Math.max(0, currentCount - 1) }).eq('id', sellerId)
    return NextResponse.json({ ok: true, sold_count: Math.max(0, currentCount - 1) })
  }

  if (action === 'remove') {
    await sb.from('listings').update({ status: 'removed' }).eq('id', listingId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'invalid action' }, { status: 400 })
}
