-- ป้องกัน user ตามหา book เดียวซ้ำ + ล้าง rows ซ้ำเก่า
-- Run once in Supabase SQL Editor

-- 1. ลบ rows ซ้ำ เก็บไว้แค่ row ล่าสุดของ (user_id, book_id)
delete from wanted w
using wanted w2
where w.user_id = w2.user_id
  and w.book_id = w2.book_id
  and w.id < w2.id;

-- 2. เพิ่ม UNIQUE constraint กันซ้ำในอนาคต
alter table wanted
  add constraint wanted_user_book_unique unique (user_id, book_id);

-- 3. Resync wanted_count จาก wanted table (หลังลบซ้ำ)
update books
set wanted_count = sub.cnt
from (
  select book_id, count(*)::int as cnt
  from wanted
  group by book_id
) sub
where books.id = sub.book_id;

update books
set wanted_count = 0
where wanted_count > 0
  and id not in (select distinct book_id from wanted);
