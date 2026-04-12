// ดึง contact info ของผู้ขาย — แยกจาก /api/listings
// ไม่ต้อง login แต่ต้องเรียกทีละ seller (กัน bulk scrape)
// ต้องส่ง listing_id + seller_id คู่กัน — กัน enumerate seller_id มั่ว
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
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
