-- =====================================================
-- 6713 PROTOCOL: PROFILE PICTURE REVEAL SYSTEM
-- =====================================================
-- Users pay 1 Talent to reveal another user's profile picture
-- Reveal is permanent unless the picture changes
-- Users choose black or white blocker for unrevealed pictures
-- =====================================================

-- =====================================================
-- 1. CREATE PROFILE PICTURE REVEALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profile_picture_reveals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  revealed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  picture_url_at_reveal TEXT, -- Track picture URL to detect changes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(viewer_id, viewed_user_id)
);

-- =====================================================
-- 2. ADD BLOCKER PREFERENCE TO PROFILES
-- =====================================================
DO $$ 
BEGIN
  -- Add blocker_preference column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'blocker_preference') THEN
    ALTER TABLE profiles ADD COLUMN blocker_preference TEXT DEFAULT 'black' CHECK (blocker_preference IN ('black', 'white'));
    RAISE NOTICE 'Added blocker_preference column to profiles table';
  ELSE
    RAISE NOTICE 'blocker_preference column already exists';
  END IF;
END $$;

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profile_picture_reveals_viewer ON profile_picture_reveals(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_picture_reveals_viewed ON profile_picture_reveals(viewed_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_picture_reveals_lookup ON profile_picture_reveals(viewer_id, viewed_user_id);

-- =====================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE profile_picture_reveals IS 'Tracks which users have paid 1 Talent to reveal profile pictures. Reveals are permanent unless picture changes.';
COMMENT ON COLUMN profile_picture_reveals.picture_url_at_reveal IS 'Stores the profile picture URL at time of reveal. If picture changes, reveal expires.';
COMMENT ON COLUMN profiles.blocker_preference IS 'User choice for profile picture blocker color: black or white. Shown to users who haven''t paid to reveal.';

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profile_picture_reveals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own reveals
CREATE POLICY "Users can view their own reveals"
  ON profile_picture_reveals FOR SELECT
  USING (viewer_id = auth.uid());

-- Policy: Users can insert their own reveals
CREATE POLICY "Users can create reveals"
  ON profile_picture_reveals FOR INSERT
  WITH CHECK (viewer_id = auth.uid());

-- Policy: Users cannot delete reveals (permanent)
-- No delete policy = cannot delete

-- Policy: Admins have full access
CREATE POLICY "Admins have full access to reveals"
  ON profile_picture_reveals FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
