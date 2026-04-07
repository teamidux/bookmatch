# BookMatch — Project Context

## คืออะไร
Marketplace ซื้อขายหนังสือมือสองที่ค้นหาด้วย ISBN
- คนซื้อดูข้อมูลได้โดยไม่ต้อง login
- login เฉพาะตอนลงขาย (ใส่เบอร์มือถืออย่างเดียว ไม่ต้อง OTP ระหว่างทดสอบ)
- BrickLink model: ISBN เดียว = หน้าเดียว รวมทุก seller
- มือหนึ่งและมือสองในที่เดียว

## ชื่อโปรเจค
BookMatch (เดิมชื่อ Loople, BookLoop)

## URLs
- Production: https://bookmatch-lac.vercel.app
- GitHub: https://github.com/teamidux/bookmatch

## Tech Stack
- **Frontend**: Next.js 14.2.5 (App Router), TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: เบอร์มือถือ + localStorage (MVP ยังไม่มี OTP จริง)
- **Barcode**: html5-qrcode
- **Hosting**: Vercel (Hobby plan, Public repo)
- **CSS**: globals.css (ไม่ใช้ Tailwind)

## Supabase Config
- URL: ดูใน .env.local
- Project: bookmatch
- Region: Southeast Asia (Singapore)

## Environment Variables
ดูใน .env.local (ไม่ commit ขึ้น GitHub) และ Vercel dashboard
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

## Database Tables

### users
- id, phone, display_name, avatar_url
- plan (free/basic/pro/shop), listings_limit
- sold_count, confirmed_count
- is_verified, is_pioneer, pioneer_count

### books
- id, isbn, title, author, publisher, description
- cover_url, language (th/en)
- first_contributor_id, source
- active_listings_count, wanted_count, min_price

### listings
- id, book_id, seller_id
- condition (new/good/fair)
- price, price_includes_shipping
- photos (array of URLs)
- contact, status (active/sold/removed)
- sold_at, confirmed_at

### wanted
- id, user_id, book_id, isbn
- max_price, status (waiting/found)

### otp_codes
- id, phone, code, expires_at, used

## File Structure
bookmatch/
├── app/
│   ├── page.tsx              # หน้าแรก + search + barcode scan
│   ├── layout.tsx            # root layout + AuthProvider
│   ├── globals.css           # CSS ทั้งหมด
│   ├── book/[isbn]/
│   │   ├── page.tsx          # Server component + SEO
│   │   └── BookDetailClient.tsx
│   ├── seller/[id]/page.tsx  # Seller profile
│   ├── sell/page.tsx         # ลงขาย (มี Suspense)
│   ├── profile/page.tsx      # จัดการ listings
│   ├── search/page.tsx       # ค้นหาชื่อ (มี Suspense)
│   └── wanted/page.tsx       # Wanted list
├── components/ui.tsx         # Nav, BottomNav, Toast, BookCover, LoginModal
├── lib/
│   ├── supabase.ts           # client + types + fetchBookByISBN
│   └── auth.tsx              # AuthContext + useAuth
├── .env.local                # ไม่ commit
├── package.json
└── tsconfig.json

## Routes
/ → หน้าแรก (ไม่ต้อง login)
/book/[isbn] → หน้าหนังสือ + sellers (ไม่ต้อง login)
/seller/[id] → seller profile (ไม่ต้อง login)
/search?q=... → ค้นหาชื่อ (ไม่ต้อง login)
/sell → ลงขาย (ต้อง login)
/profile → จัดการ listings (ต้อง login)
/wanted → Wanted list (ต้อง login)

## Pricing
Free: 20 เล่ม ฟรี
Basic: 50 เล่ม ฿199/ปี
Pro: 150 เล่ม ฿599/ปี
Shop: ไม่จำกัด ฿999/ปี

## Features ที่ทำแล้ว
- ค้นหา ISBN และชื่อหนังสือ
- ดึงข้อมูลจาก Open Library API
- Login ด้วยเบอร์มือถือ
- ลงขายพร้อมรูป (บังคับหน้าปก + optional 4 รูป)
- ราคากลางจาก transaction จริง
- Seller profile page
- Wanted List
- กดขายแล้ว + confirm + reactivate 24 ชั่วโมง
- SEO metadata
- Barcode scanner
- Pioneer badge

## TODO ถัดไป
- Supabase Storage อัปโหลดรูปจริง
- OTP SMS จริง (thaibulksms.com)
- SMS แจ้งเตือน Wanted List
- active_listings_count trigger
- PWA
- Verify ตัวตน (หลัง launch)
- Payment/Escrow (หลัง launch)

## กฎสำคัญ
1. useSearchParams() ต้องครอบด้วย Suspense เสมอ
2. params ใช้แบบ { params: { isbn: string } } (Next.js 14)
3. CSS ใช้ variables จาก globals.css
4. Auth เก็บใน localStorage key bm_user

## Business
- เจ้าของมีหนังสือ 300+ เล่ม = seed supply
- Target: นักอ่านไทย
- Go-to-market: Facebook group หนังสือมือสอง
- Expand: แผ่นเสียง, การ์ด, LEGO
