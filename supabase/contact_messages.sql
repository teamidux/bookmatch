-- Contact messages — form ติดต่อเรา
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  display_name text,
  email text,
  subject text,
  message text not null,
  ip text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_created on contact_messages(created_at desc);
alter table contact_messages enable row level security;
