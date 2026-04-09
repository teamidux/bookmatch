-- Clear first_contributor_id ออกจาก books ทั้งหมด
-- เหตุผล: เลิก track ใครเพิ่มหนังสือเข้าระบบเป็นคนแรก
-- เพื่อกัน FK constraint ตอน user ลบ/แก้ไข account
--
-- รัน 1 ครั้งบน Supabase SQL editor
-- ปลอดภัย: NULL out เท่านั้น ไม่ DROP column (rollback ได้)

UPDATE books
SET first_contributor_id = NULL
WHERE first_contributor_id IS NOT NULL;

-- ตรวจผล
SELECT COUNT(*) AS still_set FROM books WHERE first_contributor_id IS NOT NULL;
-- ควรได้ 0

-- ───────────────────────────────────────────────────────────────
-- OPTIONAL: ถ้าอยาก DROP column เลย (ทำหลังยืนยันว่าไม่มี code ใช้แล้ว)
-- ───────────────────────────────────────────────────────────────
-- ALTER TABLE books DROP COLUMN first_contributor_id;
