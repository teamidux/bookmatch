-- Pioneer count — นับจำนวนหนังสือที่ user เพิ่มเข้าระบบเป็นคนแรก
alter table users add column if not exists pioneer_count integer not null default 0;

create or replace function increment_pioneer_count(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  update users set pioneer_count = coalesce(pioneer_count, 0) + 1 where id = p_user_id;
end; $$;
