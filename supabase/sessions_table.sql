-- Sessions table for cookie-based auth
-- ใช้กับ /api/auth/line/callback → createSession() → cookie 'bm_session'
--
-- Token เป็น opaque random string (32 bytes hex = 64 chars)
-- Cookie HTTP-only ส่ง token นี้กลับมาทุก request → server lookup ใน table นี้
-- → ได้ user_id → ดึง user object

create table if not exists public.sessions (
  token text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  user_agent text,
  ip text,
  created_at timestamptz not null default now()
);

-- Index สำหรับ:
-- 1. ค้น session ตาม user_id (เช่น logout all devices)
-- 2. cleanup expired sessions
create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists sessions_expires_at_idx on public.sessions (expires_at);

-- Optional: cron job ลบ expired sessions
-- ถ้าใช้ pg_cron extension:
-- select cron.schedule('cleanup_sessions', '0 3 * * *',
--   $$ delete from public.sessions where expires_at < now() $$);
