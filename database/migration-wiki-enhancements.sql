-- =====================================================
-- 6713 PROTOCOL: WIKI PROFILE ENHANCEMENTS
-- =====================================================
-- Adds compulsory profile fields, pinned gig, and quote system
-- =====================================================

DO $$ 
BEGIN
  -- Add pinned_gig_id (verified users can pin 1 gig at top of profile)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pinned_gig_id') THEN
    ALTER TABLE profiles ADD COLUMN pinned_gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added pinned_gig_id column to profiles table';
  END IF;
  
  -- Add hobbies (compulsory)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'hobbies') THEN
    ALTER TABLE profiles ADD COLUMN hobbies TEXT;
    RAISE NOTICE 'Added hobbies column to profiles table';
  END IF;
  
  -- Add movies (array of 3 movie names - compulsory)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'movies') THEN
    ALTER TABLE profiles ADD COLUMN movies TEXT[] DEFAULT ARRAY[]::TEXT[];
    RAISE NOTICE 'Added movies column to profiles table';
  END IF;
  
  -- Add songs (array of 3 song names - compulsory)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'songs') THEN
    ALTER TABLE profiles ADD COLUMN songs TEXT[] DEFAULT ARRAY[]::TEXT[];
    RAISE NOTICE 'Added songs column to profiles table';
  END IF;
  
  -- Add signature_phrase (compulsory - "A phrase I always say")
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'signature_phrase') THEN
    ALTER TABLE profiles ADD COLUMN signature_phrase TEXT;
    RAISE NOTICE 'Added signature_phrase column to profiles table';
  END IF;
END $$;

-- =====================================================
-- CREATE WALL QUOTES TABLE
-- =====================================================
-- Verified users can quote phrases from other verified profiles
CREATE TABLE IF NOT EXISTS wall_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE NOT NULL,
  quoted_phrase TEXT NOT NULL,
  quoted_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quoted_username TEXT NOT NULL, -- @username for mentions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_pinned_gig ON profiles(pinned_gig_id);
CREATE INDEX IF NOT EXISTS idx_wall_quotes_message ON wall_quotes(message_id);
CREATE INDEX IF NOT EXISTS idx_wall_quotes_quoted_user ON wall_quotes(quoted_user_id);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON COLUMN profiles.pinned_gig_id IS 'Verified users can pin 1 gig at top of profile. NULL = no pinned gig.';
COMMENT ON COLUMN profiles.hobbies IS 'Compulsory field: User hobbies/interests.';
COMMENT ON COLUMN profiles.movies IS 'Compulsory field: Array of 3 favorite movie names.';
COMMENT ON COLUMN profiles.songs IS 'Compulsory field: Array of 3 favorite song names.';
COMMENT ON COLUMN profiles.signature_phrase IS 'Compulsory field: A phrase the user always says.';
COMMENT ON TABLE wall_quotes IS 'Quotes from verified user profiles on the Wall. Format: "phrase - @username"';

-- =====================================================
-- RLS POLICIES FOR WALL QUOTES
-- =====================================================
ALTER TABLE wall_quotes ENABLE ROW LEVEL SECURITY;

-- Everyone can read quotes
CREATE POLICY "Anyone can view wall quotes"
  ON wall_quotes FOR SELECT
  USING (true);

-- Only verified users can create quotes
CREATE POLICY "Verified users can create quotes"
  ON wall_quotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND verified_at IS NOT NULL
    )
  );

-- Admins have full access
CREATE POLICY "Admins have full access to quotes"
  ON wall_quotes FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
