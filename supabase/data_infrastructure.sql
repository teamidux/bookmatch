-- Data Infrastructure: เก็บข้อมูลที่มีมูลค่าต่อนักลงทุน
-- ไม่กระทบ UX — background data collection เท่านั้น
-- Run: Supabase SQL Editor

-- ─── 1. books: เพิ่ม category + list_price ───────────────────────
ALTER TABLE books ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE books ADD COLUMN IF NOT EXISTS list_price integer; -- ราคาปก (บาท) จาก Google Books

-- ─── 2. listings: เพิ่ม days_to_sell ─────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS days_to_sell integer;

-- ─── 3. search_logs: log ทุกการค้นหา ─────────────────────────────
CREATE TABLE IF NOT EXISTS search_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword text NOT NULL,
  result_count integer NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'all',       -- 'db' | 'all'
  user_id uuid REFERENCES users(id),      -- nullable (anonymous search)
  created_at timestamptz DEFAULT now()
);

-- Index สำหรับ analytics query
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_zero ON search_logs(result_count) WHERE result_count = 0;

-- ─── 4. missing_isbns: เพิ่ม resolved tracking + retry tracking ──
ALTER TABLE missing_isbns ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE missing_isbns ADD COLUMN IF NOT EXISTS resolved_book_id uuid REFERENCES books(id);
ALTER TABLE missing_isbns ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;
ALTER TABLE missing_isbns ADD COLUMN IF NOT EXISTS last_retry_at timestamptz;
