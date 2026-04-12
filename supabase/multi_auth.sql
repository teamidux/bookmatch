-- Multi-auth: เพิ่ม Facebook login support
-- Run once in Supabase SQL Editor.

-- 1. Facebook OAuth user identifier
alter table users add column if not exists facebook_id text unique;

-- 2. Index สำหรับ lookup ตอน login
create index if not exists users_facebook_id_idx on users (facebook_id) where facebook_id is not null;
create index if not exists users_phone_verified_idx on users (phone) where phone_verified_at is not null;
