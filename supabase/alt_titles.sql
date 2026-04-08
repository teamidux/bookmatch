-- Add alt_titles + better fuzzy search.
-- Run once in Supabase SQL Editor.

-- 1. pg_trgm for fuzzy/trigram matching (better than plain ILIKE)
create extension if not exists pg_trgm;

-- 2. alt_titles column — user-contributed Thai aliases
alter table books add column if not exists alt_titles text;

-- 3. GIN trigram indexes for fast fuzzy ILIKE on title/author/alt_titles
create index if not exists books_title_trgm_idx on books using gin (title gin_trgm_ops);
create index if not exists books_author_trgm_idx on books using gin (author gin_trgm_ops);
create index if not exists books_alt_titles_trgm_idx on books using gin (alt_titles gin_trgm_ops);

-- 4. RPC: fuzzy search ranked by best-match logic
-- Handles partial matches like "สำเร็จ" → "สำเร็จนอกกรอบ"
create or replace function search_books_fuzzy(
  search_query text,
  max_results int default 50
)
returns table (
  id uuid,
  isbn text,
  title text,
  author text,
  cover_url text,
  wanted_count int,
  alt_titles text,
  rank int
)
language sql
stable
as $$
  select
    b.id,
    b.isbn,
    b.title,
    b.author,
    b.cover_url,
    b.wanted_count,
    b.alt_titles,
    case
      when b.title ilike search_query || '%' then 1                      -- title prefix
      when b.title ilike '%' || search_query || '%' then 2                -- title contains
      when b.alt_titles ilike '%' || search_query || '%' then 3           -- alias contains
      when b.author ilike '%' || search_query || '%' then 4               -- author contains
      else 5
    end as rank
  from books b
  where
    b.title ilike '%' || search_query || '%'
    or b.author ilike '%' || search_query || '%'
    or b.alt_titles ilike '%' || search_query || '%'
  order by rank, b.wanted_count desc nulls last, b.created_at desc
  limit max_results;
$$;
