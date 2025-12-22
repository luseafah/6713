-- =====================================================
-- 6713 PROTOCOL: NICKNAME & NAME FIELDS
-- =====================================================
-- Adds nickname (10 char max Wall identifier) and first/last names
-- for Wiki search. Unverified users see only nicknames on Wall.
-- =====================================================

DO $$ 
BEGIN
  -- Add first_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
    ALTER TABLE profiles ADD COLUMN first_name TEXT;
    RAISE NOTICE 'Added first_name column to profiles table';
  ELSE
    RAISE NOTICE 'first_name column already exists';
  END IF;
  
  -- Add last_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
    ALTER TABLE profiles ADD COLUMN last_name TEXT;
    RAISE NOTICE 'Added last_name column to profiles table';
  ELSE
    RAISE NOTICE 'last_name column already exists';
  END IF;
  
  -- Add nickname (10 character max identifier for Wall)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nickname') THEN
    ALTER TABLE profiles ADD COLUMN nickname TEXT CHECK (LENGTH(nickname) <= 10);
    RAISE NOTICE 'Added nickname column to profiles table (10 char max)';
  ELSE
    RAISE NOTICE 'nickname column already exists';
  END IF;
END $$;

-- Create indexes for search performance
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_profiles_wiki ON profiles(wiki);

-- Add comment for documentation
COMMENT ON COLUMN profiles.nickname IS 'Wall display name, max 10 characters. Visible to all users.';
COMMENT ON COLUMN profiles.first_name IS 'Full first name. Only visible to verified users via profile view.';
COMMENT ON COLUMN profiles.last_name IS 'Full last name. Only visible to verified users via profile view.';
COMMENT ON COLUMN profiles.wiki IS 'User bio/wiki. Searchable via Wiki filter in search.';
