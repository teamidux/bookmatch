# Founder Notes — BookMatch

บันทึกความเห็นตรงๆ จาก Claude เกี่ยวกับโปรเจกต์และตัวคุณเอง
เก็บไว้ดูเตือนใจตอนเหนื่อยหรือสับสน

วันที่: 2026-04-08

---

## สรุปสั้นๆ

**Product:** ดี UX ว้าว มีของจริง
**คุณ:** ฉลาดกว่าผู้คุมงานทั่วไป — มี product instinct + business sense
**ความเสี่ยง:** ไม่ใช่เรื่องฟีเจอร์ แต่คือ distribution + ความอึด
**คำแนะนำใหญ่ที่สุด:** Tech ใช้เวลา 1 เดือน Distribution ใช้เวลา 1 ปี — อย่าหลงรักผลิตภัณฑ์ ลงไปคลุกตลาด

---

## โปรเจกต์ BookMatch ชนะตลาดไทยได้มั้ย

### ข้อดีจริง
- **Scan ISBN → เจอผู้ขาย** UX ใหม่ ไม่มีคู่แข่ง
- **Wantlist + notification** = network effect
- **Google Books integration** = catalog เต็มทันที (smart move)
- **PWA** = ไม่มี app store friction
- **คุณภาพ UI** ดีกว่ามือสมัครเล่น 90%

### ความจริงที่ต้องยอมรับ
- ตลาดหนังสือมือสองไทยเล็ก
- คู่แข่งจริงคือ **กลุ่ม Facebook**, **Shopee/Lazada**, **Pantip Marketplace**
- พวกนี้ฟีเจอร์แย่กว่า แต่มี distribution + trust ที่คุณยังไม่มี

### สิ่งที่จะตัดสินว่าชนะหรือแพ้

| ปัจจัย | สถานะ |
|---|---|
| Product-market fit | กำลังพิสูจน์ ✅ |
| **Distribution** ← สำคัญสุด | ❌ ยังไม่มี strategy |
| Trust/Payment (escrow, รีวิว) | ❌ |
| Critical mass (chicken-egg) | ❌ |
| Retention measurement | ❌ |
| ความอึด 1-2 ปี | ❓ |

**สรุป:** ผลิตภัณฑ์ดีพอจะชนะได้ แต่ไม่ชนะด้วยฟีเจอร์ — ชนะด้วยความอึดและฉลาดเรื่อง go-to-market

---

## คุณเป็นแค่ผู้คุมงาน หรือฉลาดจริง?

**คำตอบ: ไม่ใช่แค่ผู้คุมงาน**

### หลักฐานที่เห็น
1. **คิดเชิง psychology** — ถามเรื่อง PWA install copy โดยใช้คำว่า "หลักจิตวิทยา"
2. **Debugging instinct** — เห็นปัญหา observability ก่อนเห็นปัญหา feature
3. **Hypothesis-driven** — เดา `@zxing/browser` แม้ผิด แต่กระบวนการคิดถูก
4. **Business analytics instinct** — "อยากเก็บข้อมูลคนหาอะไรเยอะ"
5. **Cost-conscious** — ถามราคา OTP, ถามว่ามี free option
6. **Prioritization** — "LINE ก่อน OTP ทีหลัง" คิดตาม impact/effort

### คะแนนตรงๆ

| | คะแนน |
|---|---|
| Product instinct | 8/10 |
| Tech literacy | 7/10 |
| Business thinking | 6/10 |
| Execution velocity | 9/10 |
| ความอึด | ❓ จะรู้หลัง 6 เดือน |

### สิ่งที่ยังขาด (ตรงๆ)
1. **Metrics literacy** — north star, conversion funnel, retention cohort
2. **Go-to-market strategy** — 100 user แรกจะมาจากไหน?
3. **Defensibility** — ถ้าดังขึ้น Shopee copy ได้ใน 2 สัปดาห์ คุณมีอะไรที่เขา copy ไม่ได้?

---

## Skill Development Plan

ทักษะที่ควรเสริมเรียงตามความสำคัญ:

### 1. Metrics & Analytics Literacy ⭐ (สำคัญสุด)
- **North Star Metric** — ตัวเลขเดียวที่บอกว่าธุรกิจดีหรือแย่
- **AARRR Funnel** (Acquisition → Activation → Retention → Referral → Revenue)
- **Retention cohorts** — คนสมัครเดือนนี้ยังกลับมาอีกเดือนหน้ามั้ย
- **LTV / CAC** (Lifetime Value / Customer Acquisition Cost)

**เริ่มยังไง:**
- อ่าน "Lean Analytics" by Alistair Croll (ภาษาอังกฤษ แต่มีสรุปไทยใน Medium)
- ดู YouTube: Lenny Rachitsky channel
- ฝึก: ถามตัวเองว่า BookMatch's North Star คืออะไร
  - candidate: "จำนวน successful matches ต่อสัปดาห์" (= ผู้ซื้อเจอผู้ขาย → ติดต่อ)

### 2. Customer Development / User Research
- **Jobs-to-be-Done framework** — เข้าใจว่าทำไม user "จ้าง" product ของคุณ
- **คุยกับ user 5-10 คนต่อสัปดาห์** — สำคัญกว่าโค้ด

**เริ่มยังไง:**
- อ่าน "The Mom Test" by Rob Fitzpatrick — บางมาก สั้น เปลี่ยนชีวิต
- ฝึก: คุยกับคนที่ใช้ BookMatch จริง อย่าถาม "ชอบมั้ย" ให้ถามว่า "ครั้งล่าสุดที่คุณซื้อหนังสือมือสองคือเมื่อไหร่ ทำยังไง"

### 3. Go-to-Market / Distribution
- **Growth loops** — คน A ใช้ → ทำให้คน B รู้จัก → ใช้ → วนซ้ำ
- **Community-led growth** — สร้าง community ที่คนอยากเข้า
- **Content marketing** — ให้ของฟรีก่อนได้เงิน

**เริ่มยังไง:**
- อ่าน "Traction" by Gabriel Weinberg (ผู้ก่อตั้ง DuckDuckGo) — มี 19 ช่องทาง marketing ลองทุกช่องทาง
- ฝึก: เขียนรายชื่อ 19 ช่องทาง ลำดับความเหมาะสมกับ BookMatch

### 4. Unit Economics
- **Contribution margin per user** — ได้กี่บาทต่อ user หลังหักต้นทุน
- **Payback period** — กี่เดือนคืนทุนค่า marketing
- ถ้าไม่มีกำไรต่อ user → ระวัง อย่าเร่ง scale

**เริ่มยังไง:**
- ทำ Excel ง่ายๆ: 1 user เสียค่าอะไรบ้าง (server, SMS, payment fee)
- ทำกี่บาทถึงคุ้ม

### 5. Storytelling
- การเล่าเรื่อง BookMatch ใน 30 วินาทีให้คนเข้าใจ "ทำไมต้องใช้"
- สำคัญตอน: pitch นักลงทุน, เขียน landing page, สัมภาษณ์ press

**เริ่มยังไง:**
- ดู Y Combinator pitch videos บน YouTube
- ฝึกเขียน BookMatch ใน 1 ประโยค: "BookMatch คือ ___ สำหรับ ___ ที่ ___"

---

## Reading List (เรียงตามความสำคัญ)

| ลำดับ | หนังสือ | ทำไมต้องอ่าน | เวลา |
|---|---|---|---|
| 1 | **The Mom Test** — Rob Fitzpatrick | สอนคุยกับ user ให้ได้ความจริง | 3 ชม |
| 2 | **Lean Analytics** — Croll & Yoskovitz | เข้าใจ metrics แบบที่ founder ต้องรู้ | 1 สัปดาห์ |
| 3 | **Traction** — Weinberg & Mares | ตอบคำถาม "100 user แรกมาจากไหน" | 1 สัปดาห์ |
| 4 | **Hooked** — Nir Eyal | สร้าง habit-forming product | 2-3 วัน |
| 5 | **Crossing the Chasm** — Geoffrey Moore | ก้าวจาก early adopter สู่ mainstream | 1 สัปดาห์ |

ถ้าอ่านแค่เล่มเดียว → **The Mom Test** (สั้น, ใช้ได้ทันที)

---

## Channels ติดตาม

**YouTube ฟรี (ภาษาอังกฤษ):**
- **Lenny's Podcast** — สัมภาษณ์ PM/founder ระดับโลก
- **Y Combinator** — startup advice
- **Garry Tan** (CEO YC) — short founder tips
- **My First Million** — entrepreneur stories

**ภาษาไทย:**
- **The Secret Sauce** — Stock & Toey สัมภาษณ์ founder ไทย
- **Mission to the Moon** — business mindset
- **Blockdit** — มี founder ไทยหลายคนเขียน

---

## Mantra

> Tech ทำเสร็จได้ใน 1 เดือน
> Distribution ทำ 1 ปียังไม่จบ

> คนที่ชนะคือคนปล่อยของก่อน ไม่ใช่คนที่ออกแบบสมบูรณ์ที่สุด

> อย่าหลงรักผลิตภัณฑ์ตัวเอง — ฟังลูกค้า

> Founder ที่ดีไม่ใช่คนที่รู้ทุกอย่าง — เป็นคนที่รู้ว่าอะไรไม่รู้
