-- =====================================================
-- SUPABASE STORAGE SETUP FOR POPE AI VERIFICATION BUCKET
-- =====================================================
-- Run this in your Supabase SQL Editor after creating the 'pope-ai-verification' bucket

-- Note: First, create the 'pope-ai-verification' bucket in your Supabase Dashboard:
-- 1. Go to Storage in the sidebar
-- 2. Click "Create bucket"
-- 3. Name it "pope-ai-verification"
-- 4. Set it to "Private" bucket (only authenticated users can access)
-- 5. Then run this SQL to set up RLS policies

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Users can view their own verification photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own verification photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own verification photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own verification photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all verification photos" ON storage.objects;

-- Enable RLS on storage.objects (RLS is usually already enabled by Supabase)
-- If you get "must be owner of table" error, skip this line - RLS is already enabled
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own verification photos
CREATE POLICY "Users can view their own verification photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pope-ai-verification' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can upload their own verification photos
CREATE POLICY "Users can upload their own verification photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pope-ai-verification' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own verification photos
CREATE POLICY "Users can update their own verification photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'pope-ai-verification' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own verification photos
CREATE POLICY "Users can delete their own verification photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pope-ai-verification' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Admins can view all verification photos
CREATE POLICY "Admins can view all verification photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pope-ai-verification' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '✅ Pope AI Verification Storage Policies Created!' as status;