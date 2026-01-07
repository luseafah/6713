-- ============================================================================
-- HAMBURGER MENU SEARCH SYSTEM
-- Project 6713 - The High-Speed Transit Hub
-- ============================================================================
-- 
-- This migration implements the complete Search infrastructure:
--   1. Search History tracking (10 recent searches)
--   2. Volatile Tags (Elite 6 trending hashtags)
--   3. Slashed Tags (Admin tag gardening)
--   4. Admin hidden search (COMA profiles, slashed content)
-- ============================================================================

-- ============================================================================
-- 1. SEARCH HISTORY (10 Recent Searches)
-- ============================================================================
-- Tracks user's last 10 searches for quick re-navigation

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  search_query TEXT NOT NULL,
  search_type TEXT CHECK (search_type IN ('human', 'sound', 'tag', 'gig')) NOT NULL,
  result_id UUID, -- ID of the clicked result (user_id, sound_id, tag_id, or gig_id)
  result_name TEXT, -- Display name of clicked result
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE search_history IS 'Last 10 searches per user for quick re-navigation';
COMMENT ON COLUMN search_history.search_type IS 'Type of search performed: human, sound, tag, or gig';
COMMENT ON COLUMN search_history.result_id IS 'ID of the result that was clicked';

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_type ON search_history(search_type);

-- Auto-delete 11th+ search history entry (keep only last 10)
CREATE OR REPLACE FUNCTION maintain_search_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete older entries beyond the 10 most recent
  DELETE FROM search_history
  WHERE id IN (
    SELECT id
    FROM search_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 10
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER auto_clean_search_history
  AFTER INSERT ON search_history
  FOR EACH ROW
  EXECUTE FUNCTION maintain_search_history();

-- ============================================================================
-- 2. VOLATILE TAGS (Elite 6 Trending Hashtags)
-- ============================================================================
-- Tracks the most active hashtags in the Elite 6 for search suggestions

CREATE TABLE IF NOT EXISTS volatile_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_trending BOOLEAN DEFAULT FALSE, -- Appears in search suggestions
  language_code TEXT DEFAULT 'en', -- ISO language code for adaptation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE volatile_tags IS 'Trending hashtags from Elite 6 videos for search suggestions';
COMMENT ON COLUMN volatile_tags.is_trending IS 'If true, appears in search filter suggestions';
COMMENT ON COLUMN volatile_tags.language_code IS 'Language for regional adaptation';

CREATE INDEX IF NOT EXISTS idx_volatile_tags_trending ON volatile_tags(is_trending, usage_count DESC) WHERE is_trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_volatile_tags_language ON volatile_tags(language_code, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_volatile_tags_usage ON volatile_tags(usage_count DESC);

-- ============================================================================
-- 3. SLASHED TAGS (Admin Tag Gardening)
-- ============================================================================
-- Admins can slash tags to remove them from global search suggestions

CREATE TABLE IF NOT EXISTS slashed_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  slashed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  slash_reason TEXT,
  slashed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE slashed_tags IS 'Tags removed from search suggestions by moderators';
COMMENT ON COLUMN slashed_tags.slash_reason IS 'Optional reason for slashing tag';

CREATE INDEX IF NOT EXISTS idx_slashed_tags_tag ON slashed_tags(tag);

-- ============================================================================
-- 4. SEARCH RESULT METADATA (13+ Display Logic)
-- ============================================================================
-- Stores aggregate data for search results with 13+ philosophy

CREATE TABLE IF NOT EXISTS search_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT CHECK (entity_type IN ('sound', 'user', 'tag')) NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  video_count INTEGER DEFAULT 0, -- For sounds: number of videos
  follower_count INTEGER DEFAULT 0, -- For users: followers
  usage_count INTEGER DEFAULT 0, -- For tags: usage count
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

COMMENT ON TABLE search_metadata IS 'Cached search result data with 13+ display logic';
COMMENT ON COLUMN search_metadata.video_count IS 'Displayed as "13+" if >=13';

CREATE INDEX IF NOT EXISTS idx_search_metadata_type ON search_metadata(entity_type);
CREATE INDEX IF NOT EXISTS idx_search_metadata_entity ON search_metadata(entity_id);

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to add search to history
CREATE OR REPLACE FUNCTION add_search_to_history(
  p_user_id UUID,
  p_query TEXT,
  p_type TEXT,
  p_result_id UUID DEFAULT NULL,
  p_result_name TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO search_history (user_id, search_query, search_type, result_id, result_name)
  VALUES (p_user_id, p_query, p_type, p_result_id, p_result_name);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_search_to_history IS 'Adds search to user history (auto-maintains 10 max)';

-- Function to get volatile tags (filtered by language)
CREATE OR REPLACE FUNCTION get_volatile_tags(
  p_language_code TEXT DEFAULT 'en',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  tag TEXT,
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT vt.tag, vt.usage_count
  FROM volatile_tags vt
  LEFT JOIN slashed_tags st ON vt.tag = st.tag
  WHERE vt.is_trending = TRUE
    AND st.tag IS NULL -- Exclude slashed tags
    AND vt.language_code = p_language_code
  ORDER BY vt.usage_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_volatile_tags IS 'Returns trending tags excluding slashed ones, filtered by language';

-- Function to slash a tag (admin only)
CREATE OR REPLACE FUNCTION slash_tag(
  p_tag TEXT,
  p_mod_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_mod BOOLEAN;
BEGIN
  -- Verify user is moderator (check for admin role)
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM profiles WHERE id = p_mod_user_id AND is_admin = TRUE) THEN TRUE
      ELSE FALSE
    END INTO v_is_mod;

  IF NOT v_is_mod THEN
    RAISE EXCEPTION 'Only moderators can slash tags';
  END IF;

  -- Insert slashed tag
  INSERT INTO slashed_tags (tag, slashed_by, slash_reason)
  VALUES (LOWER(p_tag), p_mod_user_id, p_reason)
  ON CONFLICT (tag) DO NOTHING;

  -- Remove from trending
  UPDATE volatile_tags
  SET is_trending = FALSE
  WHERE tag = LOWER(p_tag);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION slash_tag IS 'Admin action: Remove tag from search suggestions';

-- Function to unslash a tag (restore to suggestions)
CREATE OR REPLACE FUNCTION unslash_tag(
  p_tag TEXT,
  p_mod_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_mod BOOLEAN;
BEGIN
  -- Verify user is moderator (check for admin role)
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM profiles WHERE id = p_mod_user_id AND is_admin = TRUE) THEN TRUE
      ELSE FALSE
    END INTO v_is_mod;

  IF NOT v_is_mod THEN
    RAISE EXCEPTION 'Only moderators can unslash tags';
  END IF;

  -- Remove from slashed tags
  DELETE FROM slashed_tags WHERE tag = LOWER(p_tag);

  -- Restore to trending if it was popular
  UPDATE volatile_tags
  SET is_trending = TRUE
  WHERE tag = LOWER(p_tag) AND usage_count > 10;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION unslash_tag IS 'Admin action: Restore tag to search suggestions';

-- Drop any existing search_humans functions to avoid conflicts
DROP FUNCTION IF EXISTS search_humans(text, boolean, integer);
DROP FUNCTION IF EXISTS search_humans(text);

-- Function to search humans (with COMA filter + full name search)
CREATE OR REPLACE FUNCTION search_humans(
  p_query TEXT,
  p_include_coma BOOLEAN DEFAULT FALSE, -- Admin toggle
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  full_name TEXT,
  profile_photo_url TEXT,
  is_verified BOOLEAN,
  is_coma BOOLEAN,
  coma_cost INTEGER -- 100 Talents if in COMA
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    get_username(p.id) AS username,
    p.bio AS display_name,
    CONCAT_WS(' ', p.first_name, p.last_name) AS full_name,
    p.profile_photo_url,
    (p.verified_at IS NOT NULL) AS is_verified,
    p.coma_status AS is_coma,
    p.coma_cost
  FROM profiles p
  WHERE (
    get_username(p.id) ILIKE '%' || p_query || '%'
    OR p.bio ILIKE '%' || p_query || '%'
    OR p.first_name ILIKE '%' || p_query || '%'
    OR p.last_name ILIKE '%' || p_query || '%'
    OR CONCAT(p.first_name, ' ', p.last_name) ILIKE '%' || p_query || '%'
  )
  AND (p_include_coma OR p.coma_status = FALSE) -- Filter COMA unless admin
  AND p.deactivated_at IS NULL -- Exclude deactivated
  ORDER BY 
    (p.verified_at IS NOT NULL) DESC, -- Verified first
    p.coma_status ASC, -- Active before COMA
    get_username(p.id) ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_humans IS 'Search users by username, display name, or full name with COMA filtering';

-- Function to search sounds (with 13+ video count)
CREATE OR REPLACE FUNCTION search_sounds(
  p_query TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  sound_id UUID,
  sound_name TEXT,
  artist_name TEXT,
  video_count_display TEXT, -- "13+" if >=13
  actual_video_count INTEGER,
  is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id AS sound_id,
    ss.sound_name,
    ss.artist_name,
    CASE 
      WHEN COUNT(e6.id) >= 13 THEN '13+'
      ELSE COUNT(e6.id)::TEXT
    END AS video_count_display,
    COUNT(e6.id)::INTEGER AS actual_video_count,
    (u.verified_at IS NOT NULL) AS is_verified
  FROM sound_snippets ss
  LEFT JOIN elite_6_videos e6 ON ss.id = e6.sound_snippet_id
  LEFT JOIN users u ON ss.artist_user_id = u.id
  WHERE ss.sound_name ILIKE '%' || p_query || '%'
    OR ss.artist_name ILIKE '%' || p_query || '%'
  GROUP BY ss.id, ss.sound_name, ss.artist_name, u.verified_at
  ORDER BY 
    (u.verified_at IS NOT NULL) DESC,
    actual_video_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_sounds IS 'Search sounds with 13+ display cap for video counts';

-- Function to search gigs
CREATE OR REPLACE FUNCTION search_gigs(
  p_query TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  gig_id UUID,
  gig_title TEXT,
  gig_description TEXT,
  creator_username TEXT,
  creator_id UUID,
  talent_reward INTEGER,
  deadline TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN,
  is_verified_only BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id AS gig_id,
    g.title AS gig_title,
    g.description AS gig_description,
    u.username AS creator_username,
    g.user_id AS creator_id,
    g.talent_reward,
    g.deadline,
    g.is_completed,
    g.is_verified_only,
    g.created_at
  FROM gigs g
  LEFT JOIN users u ON g.user_id = u.id
  WHERE (
    g.title ILIKE '%' || p_query || '%'
    OR g.description ILIKE '%' || p_query || '%'
  )
  AND g.is_completed = FALSE -- Only active gigs
  ORDER BY 
    g.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_gigs IS 'Search active gigs by title or description';

-- Function to increment volatile tag usage
CREATE OR REPLACE FUNCTION increment_tag_usage(
  p_tag TEXT,
  p_language_code TEXT DEFAULT 'en'
)
RETURNS void AS $$
BEGIN
  INSERT INTO volatile_tags (tag, usage_count, language_code, is_trending, last_used)
  VALUES (LOWER(p_tag), 1, p_language_code, TRUE, NOW())
  ON CONFLICT (tag)
  DO UPDATE SET
    usage_count = volatile_tags.usage_count + 1,
    last_used = NOW(),
    is_trending = CASE WHEN volatile_tags.usage_count + 1 >= 10 THEN TRUE ELSE volatile_tags.is_trending END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_tag_usage IS 'Increments tag usage and marks trending if >=10 uses';

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE volatile_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE slashed_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_metadata ENABLE ROW LEVEL SECURITY;

-- Search History: Users can only see their own
DROP POLICY IF EXISTS "Users can view their search history" ON search_history;
CREATE POLICY "Users can view their search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to their search history" ON search_history;
CREATE POLICY "Users can add to their search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Volatile Tags: Everyone can view
DROP POLICY IF EXISTS "Anyone can view volatile tags" ON volatile_tags;
CREATE POLICY "Anyone can view volatile tags"
  ON volatile_tags FOR SELECT
  USING (TRUE);

-- Volatile Tags: System can update
DROP POLICY IF EXISTS "System can manage volatile tags" ON volatile_tags;
CREATE POLICY "System can manage volatile tags"
  ON volatile_tags FOR ALL
  USING (TRUE);

-- Slashed Tags: Only mods can view/manage
DROP POLICY IF EXISTS "Mods can view slashed tags" ON slashed_tags;
CREATE POLICY "Mods can view slashed tags"
  ON slashed_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Mods can manage slashed tags" ON slashed_tags;
CREATE POLICY "Mods can manage slashed tags"
  ON slashed_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Search Metadata: Everyone can view
DROP POLICY IF EXISTS "Anyone can view search metadata" ON search_metadata;
CREATE POLICY "Anyone can view search metadata"
  ON search_metadata FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "System can manage search metadata" ON search_metadata;
CREATE POLICY "System can manage search metadata"
  ON search_metadata FOR ALL
  USING (TRUE);

-- ============================================================================
-- 7. VERIFICATION & SUMMARY
-- ============================================================================

DO $$ 
DECLARE
  v_search_history_count INTEGER;
  v_volatile_tags_count INTEGER;
  v_slashed_tags_count INTEGER;
  v_trending_tags_count INTEGER;
BEGIN
  -- Count existing data
  SELECT COUNT(*) INTO v_search_history_count FROM search_history;
  SELECT COUNT(*) INTO v_volatile_tags_count FROM volatile_tags;
  SELECT COUNT(*) INTO v_slashed_tags_count FROM slashed_tags;
  SELECT COUNT(*) INTO v_trending_tags_count FROM volatile_tags WHERE is_trending = TRUE;

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'HAMBURGER SEARCH MIGRATION COMPLETE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Search history entries: %', v_search_history_count;
  RAISE NOTICE 'Total volatile tags: %', v_volatile_tags_count;
  RAISE NOTICE 'Trending tags: %', v_trending_tags_count;
  RAISE NOTICE 'Slashed tags: %', v_slashed_tags_count;
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'NEW FEATURES ENABLED:';
  RAISE NOTICE '  ✓ Search History (10 max per user)';
  RAISE NOTICE '  ✓ Volatile Tags (Elite 6 trending)';
  RAISE NOTICE '  ✓ Admin Tag Gardening (slash/unslash)';
  RAISE NOTICE '  ✓ Hidden Search (COMA + slashed content)';
  RAISE NOTICE '  ✓ 13+ Display Logic for sounds';
  RAISE NOTICE '============================================================================';
END $$;
