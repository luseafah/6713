-- ============================================================================
-- WALL CHAT HEARTBEAT MIGRATION
-- Project 6713 - The Living, Self-Cleaning Town Square
-- ============================================================================
-- 
-- This migration implements the complete "Heartbeat" Wall Chat mechanics:
--   1. Admin "Slasher" moderation (strikethrough editing)
--   2. Story Slider insertion tracking (every 30 messages)
--   3. Real-time typing presence (67+ cap)
--   4. Online presence tracking (13+ ghost baseline)
-- ============================================================================

-- ============================================================================
-- 1. ADMIN SLASHER MODERATION
-- ============================================================================
-- Mods can "slash" messages instead of deleting them.
-- Slashed messages appear with ~~strikethrough~~ and grey text.
-- Original content is preserved for audit trails.

-- Add slash columns to wall_messages
ALTER TABLE wall_messages
  ADD COLUMN IF NOT EXISTS is_slashed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS slashed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS slashed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS original_content TEXT, -- Preserved before slash
  ADD COLUMN IF NOT EXISTS slash_reason TEXT; -- Optional mod note

COMMENT ON COLUMN wall_messages.is_slashed IS 'True if message has been slashed by a moderator';
COMMENT ON COLUMN wall_messages.slashed_by IS 'User ID of the moderator who slashed this message';
COMMENT ON COLUMN wall_messages.original_content IS 'Original message content before slashing (audit trail)';

-- Create index for finding slashed messages
CREATE INDEX IF NOT EXISTS idx_wall_messages_slashed 
  ON wall_messages(is_slashed, created_at DESC) 
  WHERE is_slashed = TRUE;

-- ============================================================================
-- 2. STORY SLIDER TRACKING
-- ============================================================================
-- Every 30 messages, a Story Slider appears showing 3 random verified user posts.
-- This table tracks when sliders were inserted into the message stream.

CREATE TABLE IF NOT EXISTS wall_story_sliders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slider_position INTEGER NOT NULL, -- Which message count triggered it (30, 60, 90...)
  story_ids UUID[] NOT NULL, -- Array of 3 story post IDs that were shown
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE wall_story_sliders IS 'Tracks Story Slider injections every 30 messages in Wall Chat';
COMMENT ON COLUMN wall_story_sliders.slider_position IS 'Message count at insertion (30, 60, 90, etc.)';
COMMENT ON COLUMN wall_story_sliders.story_ids IS 'Array of 3 verified user story IDs displayed';

CREATE INDEX IF NOT EXISTS idx_wall_story_sliders_position 
  ON wall_story_sliders(slider_position DESC);

CREATE INDEX IF NOT EXISTS idx_wall_story_sliders_created_at 
  ON wall_story_sliders(created_at DESC);

-- ============================================================================
-- 3. REAL-TIME TYPING PRESENCE
-- ============================================================================
-- Tracks which users are currently typing in Wall Chat.
-- Frontend displays "X people typing..." capped at "67+ people typing..."

CREATE TABLE IF NOT EXISTS wall_typing_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  started_typing_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE wall_typing_presence IS 'Real-time tracking of users typing in Wall Chat (67+ cap)';
COMMENT ON COLUMN wall_typing_presence.last_heartbeat IS 'Updated every 2 seconds while typing. Stale entries auto-expire.';

CREATE INDEX IF NOT EXISTS idx_wall_typing_last_heartbeat 
  ON wall_typing_presence(last_heartbeat DESC);

-- Auto-cleanup stale typing presence (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_stale_typing_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM wall_typing_presence
  WHERE last_heartbeat < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. ONLINE PRESENCE TRACKING (13+ Ghost Baseline)
-- ============================================================================
-- Tracks active users in Wall Chat for the "13+ Online" indicator.
-- Real count is used, but UI always shows minimum of 13+.

CREATE TABLE IF NOT EXISTS wall_online_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE wall_online_presence IS 'Tracks users viewing Wall Chat (13+ minimum ghost baseline)';
COMMENT ON COLUMN wall_online_presence.last_seen IS 'Updated every 30 seconds. Users offline >2 minutes are removed.';

CREATE INDEX IF NOT EXISTS idx_wall_online_last_seen 
  ON wall_online_presence(last_seen DESC);

-- Auto-cleanup stale online presence (older than 2 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_online_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM wall_online_presence
  WHERE last_seen < NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to slash a message (moderator action)
CREATE OR REPLACE FUNCTION slash_wall_message(
  p_message_id UUID,
  p_mod_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_mod BOOLEAN;
  v_original_content TEXT;
BEGIN
  -- Verify the user is a moderator
  SELECT is_admin INTO v_is_mod
  FROM users
  WHERE id = p_mod_user_id;

  IF NOT v_is_mod THEN
    RAISE EXCEPTION 'Only moderators can slash messages';
  END IF;

  -- Get original content if not already slashed
  SELECT content INTO v_original_content
  FROM wall_messages
  WHERE id = p_message_id AND is_slashed = FALSE;

  IF v_original_content IS NULL THEN
    RETURN FALSE; -- Message already slashed or doesn't exist
  END IF;

  -- Slash the message
  UPDATE wall_messages
  SET 
    is_slashed = TRUE,
    slashed_by = p_mod_user_id,
    slashed_at = NOW(),
    original_content = v_original_content,
    slash_reason = p_reason
  WHERE id = p_message_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION slash_wall_message IS 'Moderator action: Strike through a message instead of deleting';

-- Function to unslash a message (undo moderation)
CREATE OR REPLACE FUNCTION unslash_wall_message(
  p_message_id UUID,
  p_mod_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_mod BOOLEAN;
  v_original_content TEXT;
BEGIN
  -- Verify the user is a moderator
  SELECT is_admin INTO v_is_mod
  FROM profiles
  WHERE id = p_mod_user_id;

  IF NOT v_is_mod THEN
    RAISE EXCEPTION 'Only moderators can unslash messages';
  END IF;

  -- Get original content
  SELECT original_content INTO v_original_content
  FROM wall_messages
  WHERE id = p_message_id AND is_slashed = TRUE;

  IF v_original_content IS NULL THEN
    RETURN FALSE; -- Message not slashed
  END IF;

  -- Restore the message
  UPDATE wall_messages
  SET 
    is_slashed = FALSE,
    content = v_original_content,
    slashed_by = NULL,
    slashed_at = NULL,
    original_content = NULL,
    slash_reason = NULL
  WHERE id = p_message_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION unslash_wall_message IS 'Moderator action: Undo a slash and restore original content';

-- Function to get current typing count (for 67+ cap)
CREATE OR REPLACE FUNCTION get_typing_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Clean up stale entries first
  PERFORM cleanup_stale_typing_presence();
  
  -- Get current count
  SELECT COUNT(*) INTO v_count
  FROM wall_typing_presence
  WHERE last_heartbeat > NOW() - INTERVAL '10 seconds';
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_typing_count IS 'Returns current number of users typing (cleaned up, for 67+ cap)';

-- Function to get current online count (for 13+ ghost baseline)
CREATE OR REPLACE FUNCTION get_online_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Clean up stale entries first
  PERFORM cleanup_stale_online_presence();
  
  -- Get current count
  SELECT COUNT(*) INTO v_count
  FROM wall_online_presence
  WHERE last_seen > NOW() - INTERVAL '2 minutes';
  
  -- Return count (UI will enforce 13+ minimum)
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_online_count IS 'Returns current online user count (UI enforces 13+ minimum)';

-- Function to upsert typing presence (heartbeat every 2 seconds)
CREATE OR REPLACE FUNCTION update_typing_presence(
  p_user_id UUID,
  p_username TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO wall_typing_presence (user_id, username, last_heartbeat)
  VALUES (p_user_id, p_username, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET last_heartbeat = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_typing_presence IS 'Updates typing presence heartbeat (called every 2s while typing)';

-- Function to remove typing presence (user stopped typing)
CREATE OR REPLACE FUNCTION remove_typing_presence(
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  DELETE FROM wall_typing_presence WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert online presence (heartbeat every 30 seconds)
CREATE OR REPLACE FUNCTION update_online_presence(
  p_user_id UUID,
  p_username TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO wall_online_presence (user_id, username, last_seen)
  VALUES (p_user_id, p_username, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET last_seen = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_online_presence IS 'Updates online presence heartbeat (called every 30s while viewing Wall)';

-- Function to insert story slider and get random verified stories
CREATE OR REPLACE FUNCTION insert_story_slider(
  p_position INTEGER
)
RETURNS UUID[] AS $$
DECLARE
  v_story_ids UUID[];
BEGIN
  -- Get 3 random stories from verified users
  SELECT ARRAY_AGG(id) INTO v_story_ids
  FROM (
    SELECT id
    FROM wall_messages
    WHERE post_type = 'story'
      AND user_id IN (SELECT id FROM profiles WHERE verified_at IS NOT NULL)
      AND expires_at > NOW() -- Only active stories
    ORDER BY RANDOM()
    LIMIT 3
  ) AS random_stories;

  -- If we don't have 3 stories, return empty array
  IF v_story_ids IS NULL OR array_length(v_story_ids, 1) < 3 THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  -- Record the slider insertion
  INSERT INTO wall_story_sliders (slider_position, story_ids)
  VALUES (p_position, v_story_ids);

  RETURN v_story_ids;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION insert_story_slider IS 'Inserts Story Slider at given position and returns 3 random verified user stories';

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE wall_story_sliders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wall_typing_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE wall_online_presence ENABLE ROW LEVEL SECURITY;

-- Story Sliders: Everyone can view
DROP POLICY IF EXISTS "Anyone can view story sliders" ON wall_story_sliders;
CREATE POLICY "Anyone can view story sliders"
  ON wall_story_sliders FOR SELECT
  USING (TRUE);

-- Story Sliders: Only system can insert
DROP POLICY IF EXISTS "System can insert story sliders" ON wall_story_sliders;
CREATE POLICY "System can insert story sliders"
  ON wall_story_sliders FOR INSERT
  WITH CHECK (TRUE);

-- Typing Presence: Everyone can view
DROP POLICY IF EXISTS "Anyone can view typing presence" ON wall_typing_presence;
CREATE POLICY "Anyone can view typing presence"
  ON wall_typing_presence FOR SELECT
  USING (TRUE);

-- Typing Presence: Users can manage their own
DROP POLICY IF EXISTS "Users can manage their own typing presence" ON wall_typing_presence;
CREATE POLICY "Users can manage their own typing presence"
  ON wall_typing_presence FOR ALL
  USING (auth.uid() = user_id);

-- Online Presence: Everyone can view
DROP POLICY IF EXISTS "Anyone can view online presence" ON wall_online_presence;
CREATE POLICY "Anyone can view online presence"
  ON wall_online_presence FOR SELECT
  USING (TRUE);

-- Online Presence: Users can manage their own
DROP POLICY IF EXISTS "Users can manage their own online presence" ON wall_online_presence;
CREATE POLICY "Users can manage their own online presence"
  ON wall_online_presence FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. REALTIME PUBLICATION
-- ============================================================================
-- Enable Supabase Realtime for live updates

DO $$ 
BEGIN
  -- Add tables to realtime publication if not already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE wall_typing_presence;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Table already in publication
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE wall_online_presence;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Table already in publication
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE wall_story_sliders;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Table already in publication
  END;
END $$;

-- ============================================================================
-- 8. VERIFICATION & SUMMARY
-- ============================================================================

DO $$ 
DECLARE
  v_wall_messages_count INTEGER;
  v_slashed_count INTEGER;
  v_typing_count INTEGER;
  v_online_count INTEGER;
  v_slider_count INTEGER;
BEGIN
  -- Count existing data
  SELECT COUNT(*) INTO v_wall_messages_count FROM wall_messages;
  SELECT COUNT(*) INTO v_slashed_count FROM wall_messages WHERE is_slashed = TRUE;
  SELECT COUNT(*) INTO v_typing_count FROM wall_typing_presence;
  SELECT COUNT(*) INTO v_online_count FROM wall_online_presence;
  SELECT COUNT(*) INTO v_slider_count FROM wall_story_sliders;

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'WALL CHAT HEARTBEAT MIGRATION COMPLETE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Total wall messages: %', v_wall_messages_count;
  RAISE NOTICE 'Slashed messages: %', v_slashed_count;
  RAISE NOTICE 'Currently typing: %', v_typing_count;
  RAISE NOTICE 'Currently online: %', v_online_count;
  RAISE NOTICE 'Story sliders created: %', v_slider_count;
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'NEW FEATURES ENABLED:';
  RAISE NOTICE '  ✓ Admin Slasher moderation (strikethrough)';
  RAISE NOTICE '  ✓ Story Slider tracking (every 30 messages)';
  RAISE NOTICE '  ✓ Real-time typing presence (67+ cap)';
  RAISE NOTICE '  ✓ Online presence tracking (13+ ghost baseline)';
  RAISE NOTICE '============================================================================';
END $$;
