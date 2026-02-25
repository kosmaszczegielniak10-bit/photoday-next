-- PhotoDay 2.0 — Supabase Storage RLS Policies
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This fixes the issue where images and uploads return 400/403 or fail to load.

-- 1. Ensure the 'uploads' bucket exists and is set to PUBLIC
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing restrictive policies if they exist (optional cleanup)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- 3. Create permissive policies for the 'uploads' bucket
-- Allow anyone to read (SELECT) photos
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'uploads' );

-- Allow the API (Server) to upload (INSERT) photos
CREATE POLICY "Public Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'uploads' );

-- Allow the API (Server) to update photos
CREATE POLICY "Public Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'uploads' );

-- Allow the API (Server) to delete photos
CREATE POLICY "Public Delete" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'uploads' );

-- Note: Since our Next.js API uses the SUPABASE_SERVICE_ROLE_KEY, it bypasses RLS anyway for inserts/updates. 
-- However, the SELECT policy is CRITICAL because the browser (Next.js <img src="..." />) fetches images directly from the Supabase CDN without a service role key.
