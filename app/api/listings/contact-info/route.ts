// ดึง contact info ของผู้ขาย — ต้อง login ก่อน (กัน scrape เบอร์โทร)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/session'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // ต้อง login ก่อนเห็นเบอร์ผู้ขาย
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'login_required' }, { status: 401 })
  }

  // Rate limit: 20 ครั้ง/นาที/user กัน bulk scrape
  if (!checkRateLimit(`contact:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const sellerId = req.nextUrl.searchParams.get('seller_id')
  const listingId = req.nextUrl.searchParams.get('listing_id')
  if (!sellerId || !listingId) {
    return NextResponse.json({ error: 'missing seller_id and listing_id' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ตรวจว่า listing นี้เป็นของ seller จริง + active — กัน enumerate seller_id มั่ว
  const { data: listing } = await supabase
    .from('listings')
    .select('id')
    .eq('id', listingId)
    .eq('seller_id', sellerId)
    .eq('status', 'active')
    .maybeSingle()
  if (!listing) {
    return NextResponse.json({ error: 'listing not found' }, { status: 404 })
  }

  const { data } = await supabase
    .from('users')
    .select('line_id, phone')
    .eq('id', sellerId)
    .maybeSingle()

  return NextResponse.json({
    line_id: data?.line_id || null,
    phone: data?.phone || null,
  })
}
