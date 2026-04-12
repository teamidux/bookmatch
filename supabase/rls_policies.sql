-- RLS Policies สำหรับ tables หลัก
-- ⚠️ ต้อง run ใน Supabase SQL Editor
-- DROP policy เก่าก่อน แล้ว CREATE ใหม่ (กัน conflict)

-- ═══════════════════════════════════════════════════════════
-- USERS table
-- ═══════════════════════════════════════════════════════════
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_public_read" ON users;
DROP POLICY IF EXISTS "users_no_anon_write" ON users;
DROP POLICY IF EXISTS "users_no_anon_update" ON users;
DROP POLICY IF EXISTS "users_no_anon_delete" ON users;

CREATE POLICY "users_public_read" ON users FOR SELECT USING (true);
CREATE POLICY "users_no_anon_write" ON users FOR INSERT WITH CHECK (false);
CREATE POLICY "users_no_anon_update" ON users FOR UPDATE USING (false);
CREATE POLICY "users_no_anon_delete" ON users FOR DELETE USING (false);

-- ═══════════════════════════════════════════════════════════
-- BOOKS table
-- ═══════════════════════════════════════════════════════════
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "books_public_read" ON books;
DROP POLICY IF EXISTS "books_no_anon_write" ON books;
DROP POLICY IF EXISTS "books_no_anon_update" ON books;
DROP POLICY IF EXISTS "books_no_anon_delete" ON books;

CREATE POLICY "books_public_read" ON books FOR SELECT USING (true);
CREATE POLICY "books_no_anon_write" ON books FOR INSERT WITH CHECK (false);
CREATE POLICY "books_no_anon_update" ON books FOR UPDATE USING (false);
CREATE POLICY "books_no_anon_delete" ON books FOR DELETE USING (false);

-- ═══════════════════════════════════════════════════════════
-- LISTINGS table
-- ═══════════════════════════════════════════════════════════
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "listings_public_read" ON listings;
DROP POLICY IF EXISTS "listings_no_anon_write" ON listings;
DROP POLICY IF EXISTS "listings_no_anon_update" ON listings;
DROP POLICY IF EXISTS "listings_no_anon_delete" ON listings;

CREATE POLICY "listings_public_read" ON listings FOR SELECT USING (true);
CREATE POLICY "listings_no_anon_write" ON listings FOR INSERT WITH CHECK (false);
CREATE POLICY "listings_no_anon_update" ON listings FOR UPDATE USING (false);
CREATE POLICY "listings_no_anon_delete" ON listings FOR DELETE USING (false);

-- ═══════════════════════════════════════════════════════════
-- WANTED table
-- ═══════════════════════════════════════════════════════════
ALTER TABLE wanted ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wanted_public_read" ON wanted;
DROP POLICY IF EXISTS "wanted_no_anon_write" ON wanted;
DROP POLICY IF EXISTS "wanted_no_anon_update" ON wanted;
DROP POLICY IF EXISTS "wanted_no_anon_delete" ON wanted;

CREATE POLICY "wanted_public_read" ON wanted FOR SELECT USING (true);
CREATE POLICY "wanted_no_anon_write" ON wanted FOR INSERT WITH CHECK (false);
CREATE POLICY "wanted_no_anon_update" ON wanted FOR UPDATE USING (false);
CREATE POLICY "wanted_no_anon_delete" ON wanted FOR DELETE USING (false);

-- ═══════════════════════════════════════════════════════════
-- SEARCH_LOGS table
-- ═══════════════════════════════════════════════════════════
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- PUSH_SUBSCRIPTIONS table
-- ═══════════════════════════════════════════════════════════
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
