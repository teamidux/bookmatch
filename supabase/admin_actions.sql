-- Audit log สำหรับ admin actions
-- เก็บว่า admin ใครทำอะไรกับใคร/อะไร เมื่อไหร่ พร้อมเหตุผล
--
-- ใช้สำหรับ:
-- 1. ดู history ของการตัดสินใจ admin (กันลืม กันโดนกล่าวหา)
-- 2. Review ความผิดพลาด (ถ้าลบ user ผิด ดูใน log ได้ว่ากดเมื่อไหร่)
-- 3. PDPA / legal: ตอบ user ขอ data ได้ว่ามี action อะไรบ้าง

create table if not exists admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references users(id),
  action text not null,                    -- 'ban_user' | 'unban_user' | 'soft_delete_user' | 'remove_listing' | 'edit_book' | 'delete_avatar' | 'approve_verify' | 'reject_verify'
  target_type text not null,               -- 'user' | 'listing' | 'book'
  target_id uuid not null,                 -- id ของสิ่งที่ถูก action
  reason text,                             -- เหตุผล (จาก admin)
  metadata jsonb,                          -- ข้อมูลเสริม เช่น ก่อนแก้ค่าเป็นอะไร
  created_at timestamptz not null default now()
);

create index if not exists admin_actions_admin_idx on admin_actions (admin_id, created_at desc);
create index if not exists admin_actions_target_idx on admin_actions (target_type, target_id, created_at desc);
create index if not exists admin_actions_action_idx on admin_actions (action, created_at desc);

alter table admin_actions enable row level security;
-- ไม่เปิด policy → service role เท่านั้นที่อ่าน/เขียน
