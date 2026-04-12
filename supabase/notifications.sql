-- In-app notifications — จุดแดง + หน้าแจ้งเตือน
-- Run once in Supabase SQL Editor.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,          -- 'wanted_match' | 'contact' | 'system'
  title text not null,
  body text,
  url text,                    -- link ไปหน้าที่เกี่ยวข้อง เช่น /book/xxxx
  metadata jsonb default '{}', -- ข้อมูลเสริม เช่น book_id, listing_id
  read_at timestamptz,         -- null = ยังไม่อ่าน
  created_at timestamptz not null default now()
);

-- Index สำหรับ query ที่ใช้บ่อย
create index if not exists notifications_user_unread_idx
  on notifications (user_id, created_at desc)
  where read_at is null;

create index if not exists notifications_user_idx
  on notifications (user_id, created_at desc);

-- RLS — service role only (API routes ใช้ service role key)
alter table notifications enable row level security;

-- Cleanup: ลบ notification เก่ากว่า 90 วัน (run เป็น cron หรือ manual)
-- delete from notifications where created_at < now() - interval '90 days';
