-- Log การแจ้งเตือน wanted-match ต่อ (buyer, book, seller)
-- ใช้ dedup: แจ้ง buyer คนเดิมเรื่อง (หนังสือเล่มเดิม + seller คนเดิม) ครั้งเดียวพอ
-- Seller ใหม่มาลง → แจ้งใหม่ได้ (เพราะเป็น choice ใหม่)
--
-- Reference: app/api/notify/wanted-match/route.ts

create table if not exists wanted_notifications (
  user_id uuid not null references users(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  seller_id uuid not null references users(id) on delete cascade,
  notified_at timestamptz not null default now(),
  primary key (user_id, book_id, seller_id)
);

create index if not exists wanted_notifications_user_book_idx
  on wanted_notifications (user_id, book_id);

alter table wanted_notifications enable row level security;
-- ไม่เปิด policy → เฉพาะ service role (API) อ่าน/เขียนได้
