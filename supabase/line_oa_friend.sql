-- Track when user adds BookMatch Official Account as a friend.
-- Used by /api/line/webhook to mark subscription status.
-- Run once in Supabase SQL Editor.

alter table public.users
  add column if not exists line_oa_friend_at timestamptz;

create index if not exists users_line_oa_friend_idx
  on public.users (line_oa_friend_at)
  where line_oa_friend_at is not null;

-- Optional: ดูคนที่ subscribed ทั้งหมด
-- select id, display_name, line_oa_friend_at from users where line_oa_friend_at is not null;
