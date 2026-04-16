import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || 10), 20)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('listings')
    .select('id, price, condition, price_includes_shipping, photos, created_at, seller_id, books(id, isbn, title, author, cover_url), users!seller_id(banned_at)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit + 5) // ดึงเผื่อ กรอง banned ออกแล้วยังได้ครบ

  if (error) {
    console.error('[recent listings]', error.message)
    return NextResponse.json({ listings: [] })
  }

  // กรอง listings ของ user ที่โดน ban ออก
  const filtered = (data || [])
    .filter((l: any) => !l.users?.banned_at && !l.users?.deleted_at)
    .map((l: any) => { const { users, ...rest } = l; return rest })
    .slice(0, limit)

  return NextResponse.json({ listings: filtered })
}
