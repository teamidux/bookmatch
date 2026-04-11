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

// ใช้ nodejs runtime — เดิม edge แต่ cold start + chain ของ awaits ทำให้ timeout > 1-2 วิ
// ที่ LINE อดทน → webhook error "A timeout occurred when sending a webhook event object"
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const SITE_URL = 'https://bookmatch.app'

// ประมวลผล events ใน background — ไม่ block response
async function processEvents(events: any[]) {
  const sb = admin()

  for (const event of events) {
    const lineUserId: string | undefined = event.source?.userId
    if (!lineUserId) continue

    try {
      switch (event.type) {
        case 'follow': {
          const { data: user } = await sb
            .from('users')
            .select('id, display_name')
            .eq('line_user_id', lineUserId)
            .maybeSingle()

          if (user) {
            await sb
              .from('users')
              .update({ line_oa_friend_at: new Date().toISOString() })
              .eq('id', user.id)

            await pushLineText(
              lineUserId,
              `สวัสดีคุณ ${user.display_name} 👋\n\nขอบคุณที่ Add BookMatch เป็นเพื่อน 📚\n\nต่อไปนี้เราจะแจ้งเตือนเมื่อ:\n• มีคนลงขายหนังสือที่คุณอยากได้\n• มีคนสนใจซื้อหนังสือที่คุณขาย\n• การซื้อขายของคุณเสร็จสมบูรณ์\n\nลุยเลย → ${SITE_URL}`
            )
          } else {
            await pushLineText(
              lineUserId,
              `สวัสดี! 👋\n\nขอบคุณที่ Add BookMatch เป็นเพื่อน 📚\n\nกรุณา login เว็บด้วย LINE เดียวกันนี้ เพื่อรับแจ้งเตือนตามหนังสือที่คุณสนใจ:\n${SITE_URL}`
            )
          }
          break
        }

        case 'unfollow': {
          await sb
            .from('users')
            .update({ line_oa_friend_at: null })
            .eq('line_user_id', lineUserId)
          break
        }

        case 'message': {
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
          break
      }
    } catch (err: any) {
      console.error('[line/webhook] event error', event.type, err?.message || err)
    }
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-line-signature') || ''

  // Verify signature — ต้อง sync (security)
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

  // Fire-and-forget: ไม่ await เพื่อ return 200 ใน <100ms
  // LINE webhook timeout ~1 วิ — ห้ามรอ LINE API / DB เยอะ ๆ
  // Node runtime บน Vercel คง process alive ชั่วคราวให้ background finish ได้
  if (events.length) {
    processEvents(events).catch(err => console.error('[line/webhook] bg error', err?.message || err))
  }

  return NextResponse.json({ ok: true })
}
