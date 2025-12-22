-- =====================================================
-- 6713 PROTOCOL: REMEMBRANCE WIKI SYSTEM
-- =====================================================
-- Verified users (with admin permission) can create remembrance wikis
-- about other people (alive or dead) - featured on their main profile
-- =====================================================

-- =====================================================
-- 1. ADD PERMISSION FLAGS TO PROFILES
-- =====================================================
DO $$ 
BEGIN
  -- Add can_create_remembrance_wiki permission
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'can_create_remembrance_wiki') THEN
    ALTER TABLE profiles ADD COLUMN can_create_remembrance_wiki BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added can_create_remembrance_wiki column to profiles table';
  END IF;
  
  -- Add unlimited remembrance wiki creation toggle (admin-controlled)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'can_create_unlimited_remembrance_wikis') THEN
    ALTER TABLE profiles ADD COLUMN can_create_unlimited_remembrance_wikis BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added can_create_unlimited_remembrance_wikis column to profiles table';
  END IF;
END $$;

-- =====================================================
-- 2. CREATE REMEMBRANCE WIKIS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS remembrance_wikis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Person being remembered
  subject_name TEXT NOT NULL, -- Name of person (alive or dead)
  subject_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- If they're on platform
  relationship TEXT, -- e.g., "boyfriend", "mother", "best friend"
  
  -- Content
  title TEXT NOT NULL, -- e.g., "Remembering John", "My Boyfriend Alex"
  content TEXT NOT NULL, -- The remembrance story/tribute
  
  -- Visibility
  is_featured BOOLEAN DEFAULT TRUE, -- Show on creator's main wiki
  is_public BOOLEAN DEFAULT TRUE, -- Public or private
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE REMEMBRANCE TAGS TABLE (for multiple tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS remembrance_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remembrance_id UUID REFERENCES remembrance_wikis(id) ON DELETE CASCADE NOT NULL,
  tagged_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tagged_username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(remembrance_id, tagged_user_id)
);

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_remembrance_wikis_creator ON remembrance_wikis(creator_id);
CREATE INDEX IF NOT EXISTS idx_remembrance_wikis_subject_user ON remembrance_wikis(subject_user_id);
CREATE INDEX IF NOT EXISTS idx_remembrance_wikis_featured ON remembrance_wikis(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_remembrance_tags_remembrance ON remembrance_tags(remembrance_id);
CREATE INDEX IF NOT EXISTS idx_remembrance_tags_user ON remembrance_tags(tagged_user_id);

-- =====================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON COLUMN profiles.can_create_remembrance_wiki IS 'Admin-granted permission: Can create remembrance wikis about other people.';
COMMENT ON COLUMN profiles.can_create_unlimited_remembrance_wikis IS 'Admin toggle: Bypass 3 wiki limit, allow unlimited graphy creation about others.';
COMMENT ON TABLE remembrance_wikis IS 'Tribute pages about people (alive or dead) created by verified users. Featured on creator''s profile. Default limit: 3 graphy wikis about others (unlimited if toggled by admin).';
COMMENT ON COLUMN remembrance_wikis.subject_user_id IS 'If person being remembered is on platform, link to their profile. NULL if not on platform or deceased.';
COMMENT ON COLUMN remembrance_wikis.relationship IS 'Creator''s relationship to subject: boyfriend, mother, best friend, etc.';
COMMENT ON COLUMN remembrance_wikis.is_featured IS 'Display on creator''s main wiki page. TRUE by default.';
COMMENT ON TABLE remembrance_tags IS 'Tags for people mentioned in remembrance wikis. Links to their profiles if on platform.';

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================
ALTER TABLE remembrance_wikis ENABLE ROW LEVEL SECURITY;
ALTER TABLE remembrance_tags ENABLE ROW LEVEL SECURITY;

-- Everyone can read public remembrance wikis
CREATE POLICY "Anyone can view public remembrance wikis"
  ON remembrance_wikis FOR SELECT
  USING (is_public = TRUE);

-- Creators can view their own remembrance wikis
CREATE POLICY "Creators can view their own remembrance wikis"
  ON remembrance_wikis FOR SELECT
  USING (creator_id = auth.uid());

-- Only verified users with permission can create
CREATE POLICY "Permitted verified users can create remembrance wikis"
  ON remembrance_wikis FOR INSERT
  WITH CHECK (
    creator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND verified_at IS NOT NULL
      AND can_create_remembrance_wiki = TRUE
    )
  );

-- Creators can update their own remembrance wikis
CREATE POLICY "Creators can update their own remembrance wikis"
  ON remembrance_wikis FOR UPDATE
  USING (creator_id = auth.uid());

-- Creators can delete their own remembrance wikis
CREATE POLICY "Creators can delete their own remembrance wikis"
  ON remembrance_wikis FOR DELETE
  USING (creator_id = auth.uid());

-- Everyone can read tags
CREATE POLICY "Anyone can view remembrance tags"
  ON remembrance_tags FOR SELECT
  USING (true);

-- Creators can manage tags on their remembrance wikis
CREATE POLICY "Creators can manage tags on their remembrance wikis"
  ON remembrance_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM remembrance_wikis 
      WHERE id = remembrance_id 
      AND creator_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "Admins have full access to remembrance wikis"
  ON remembrance_wikis FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins have full access to remembrance tags"
  ON remembrance_tags FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
