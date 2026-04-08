-- Track scam/abuse reports against sellers.
-- Run once in Supabase SQL Editor.
--
-- Admin reviews these to suspend bad accounts.

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reported_user_id uuid not null references users(id) on delete cascade,
  reporter_user_id uuid references users(id) on delete set null,
  listing_id uuid references listings(id) on delete set null,
  reason text not null,                                -- 'scam' | 'fake_book' | 'no_ship' | 'inappropriate' | 'other'
  details text,
  status text not null default 'pending',              -- 'pending' | 'reviewing' | 'actioned' | 'dismissed'
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists reports_status_idx on reports (status, created_at desc);
create index if not exists reports_reported_user_idx on reports (reported_user_id);

alter table reports enable row level security;
-- ไม่เปิด policy ใดๆ → เฉพาะ service role อ่าน/เขียนได้
