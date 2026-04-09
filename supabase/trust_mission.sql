-- Trust Mission columns
-- ใช้กับ TrustMission card บนหน้า Profile + listing badges
--
-- Items ของ mission (5 items × 20%):
--   1. Login ด้วย LINE              → auto (user มี id)
--   2. ใส่ LINE ID                   → users.line_id is not null
--   3. ยืนยันเบอร์โทร                → users.phone_verified_at is not null
--   4. ยืนยันตัวตน (บัตร+สมุดบัญชี)   → users.id_verified_at is not null
--   5. Add @BookMatch OA              → users.line_oa_friend_at is not null

alter table public.users
  add column if not exists phone_verified_at timestamptz;

alter table public.users
  add column if not exists id_verified_at timestamptz;

-- Track ตอน user ส่งเอกสาร — admin จะ approve โดย set id_verified_at = now()
alter table public.users
  add column if not exists id_verify_submitted_at timestamptz;

-- Verify migration:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'users' AND column_name in
--   ('phone_verified_at', 'id_verified_at', 'id_verify_submitted_at');

-- Self-approve สำหรับ test (admin role ภายหลัง):
-- UPDATE users SET id_verified_at = NOW() WHERE id = '<your-user-id>';
