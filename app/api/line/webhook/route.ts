// LINE Official Account webhook
// รับ events จาก LINE: follow, unfollow, message
//
// Setup:
// 1. ตั้ง LINE_OA_CHANNEL_SECRET + LINE_OA_CHANNEL_ACCESS_TOKEN ใน Vercel env
// 2. รัน supabase/line_oa_friend.sql
// 3. ใน LINE Developers Console → Messaging API tab:
//    - Webhook URL: https://YOUR_DOMAIN/api/line/webhook
//    - Use webhook: ON
//    - กด Verify (LINE จะส่ง dummy event มา)
// 4. OA Manager → Response settings:
//    - Auto-response messages: OFF
//    - Webhooks: ON

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyLineSignature, pushLineText, replyLineMessage } from '@/lib/line-bot'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const SITE_URL = 'https://bookmatch-murex.vercel.app'

export async function POST(req: NextRequest) {
  // อ่าน raw body — จำเป็นสำหรับ signature verify
  const rawBody = await req.text()
  const signature = req.headers.get('x-line-signature') || ''

  // Verify signature — กัน fake webhook จาก attacker
  const valid = await verifyLineSignature(rawBody, signature)
  if (!valid) {
    console.warn('[line/webhook] invalid signature, len:', signature.length)
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const events = payload.events || []
  if (!events.length) return NextResponse.json({ ok: true }) // verify ping

  const sb = admin()

  for (const event of events) {
    const lineUserId: string | undefined = event.source?.userId
    if (!lineUserId) continue

    try {
      switch (event.type) {
        case 'follow': {
          // User add OA เป็นเพื่อน → mark subscribed + ส่ง welcome
          // Match กับ BookMatch user ที่ login ด้วย LINE เดียวกัน (provider เดียวกัน = userId เดียวกัน)
          const { data: user } = await sb
            .from('users')
            .select('id, display_name')
            .eq('line_user_id', lineUserId)
            .maybeSingle()

          if (user) {
            // User เคย login ใน BookMatch แล้ว → mark friend
            await sb
              .from('users')
              .update({ line_oa_friend_at: new Date().toISOString() })
              .eq('id', user.id)
              .then(() => {})
              // Silent ignore ถ้า column ยังไม่มี (migration ยังไม่รัน)
              // .catch(...) — supabase-js promise ใช้ .then() chain แทน

            await pushLineText(
              lineUserId,
              `สวัสดีคุณ ${user.display_name} 👋\n\nขอบคุณที่ Add BookMatch เป็นเพื่อน 📚\n\nต่อไปนี้เราจะแจ้งเตือนเมื่อ:\n• มีคนลงขายหนังสือที่คุณอยากได้\n• มีคนสนใจซื้อหนังสือที่คุณขาย\n• การซื้อขายของคุณเสร็จสมบูรณ์\n\nลุยเลย → ${SITE_URL}`
            )
          } else {
            // User add OA แต่ยังไม่เคย login BookMatch
            await pushLineText(
              lineUserId,
              `สวัสดี! 👋\n\nขอบคุณที่ Add BookMatch เป็นเพื่อน 📚\n\nกรุณา login เว็บด้วย LINE เดียวกันนี้ เพื่อรับแจ้งเตือนตามหนังสือที่คุณสนใจ:\n${SITE_URL}`
            )
          }
          break
        }

        case 'unfollow': {
          // User block หรือ remove OA → mark unsubscribed
          await sb
            .from('users')
            .update({ line_oa_friend_at: null })
            .eq('line_user_id', lineUserId)
          break
        }

        case 'message': {
          // User ส่งข้อความมา OA → reply เบาๆ
          // ใช้ reply (ฟรี) ไม่ใช่ push (กิน quota)
          const replyToken = event.replyToken
          if (replyToken) {
            await replyLineMessage(replyToken, [
              {
                type: 'text',
                text: `ขอบคุณที่ติดต่อ BookMatch! 📚\n\nระบบยังไม่รองรับการสนทนาที่นี่\nกรุณาเข้าใช้งานที่เว็บ:\n${SITE_URL}`,
              },
            ])
          }
          break
        }

        default:
          // ignore event types อื่น (postback, beacon, etc.)
          break
      }
    } catch (err: any) {
      // Log แต่ไม่ fail ทั้ง webhook (LINE จะ retry ถ้า return non-200)
      console.error('[line/webhook] event error', event.type, err?.message || err)
    }
  }

  // Always return 200 ให้ LINE — ไม่งั้น LINE จะ retry หลายรอบ
  return NextResponse.json({ ok: true })
}
