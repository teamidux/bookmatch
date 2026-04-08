-- Track how many times each book detail page has been viewed.
-- Run once in Supabase SQL Editor.

alter table public.books add column if not exists view_count int default 0;

create index if not exists books_view_count_idx on public.books (view_count desc);

-- Optional helper RPC: atomic increment
create or replace function increment_book_view(p_isbn text)
returns void
language sql
security definer
as $$
  update public.books
  set view_count = coalesce(view_count, 0) + 1
  where isbn = p_isbn;
$$;
