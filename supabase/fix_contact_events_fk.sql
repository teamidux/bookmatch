-- Fix: contact_events FK ไม่มี ON DELETE → ลบ user ไม่ได้
-- เปลี่ยนเป็น ON DELETE SET NULL (เก็บ event ไว้ แต่ set user_id = null)

alter table contact_events drop constraint if exists contact_events_seller_id_fkey;
alter table contact_events drop constraint if exists contact_events_buyer_id_fkey;

alter table contact_events
  add constraint contact_events_seller_id_fkey
  foreign key (seller_id) references users(id) on delete set null;

alter table contact_events
  add constraint contact_events_buyer_id_fkey
  foreign key (buyer_id) references users(id) on delete set null;
