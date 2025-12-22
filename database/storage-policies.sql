-- =====================================================
-- SUPABASE STORAGE SETUP FOR MEDIA BUCKET
-- =====================================================
-- Run this in your Supabase SQL Editor after creating the 'media' bucket

-- Note: First, create the 'media' bucket in your Supabase Dashboard:
-- 1. Go to Storage in the sidebar
-- 2. Click "Create bucket"
-- 3. Name it "media"
-- 4. Set it to "Public" bucket
-- 5. Then run this SQL to set up RLS policies

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
DROP POLICY IF EXISTS "Admins have full access to media" ON storage.objects;

-- Enable RLS on storage.objects (RLS is usually already enabled by Supabase)
-- If you get "must be owner of table" error, skip this line - RLS is already enabled
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view/download media (public read)
CREATE POLICY "Public can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Policy: Authenticated users can upload media
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media' AND
    auth.role() = 'authenticated'
  );

-- Policy: Users can update their own media
CREATE POLICY "Users can update their own media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media' AND
    auth.uid() = owner
  );

-- Policy: Users can delete their own media
CREATE POLICY "Users can delete their own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media' AND
    auth.uid() = owner
  );

-- Policy: Admins have full access to media
CREATE POLICY "Admins have full access to media"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'media' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Verify policies were created
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
