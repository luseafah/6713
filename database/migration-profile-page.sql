-- =====================================================
-- Project 6713: Profile Page Database Migration
-- =====================================================
-- Purpose: Complete infrastructure for the Profile Page
-- Features:
--   1. Anchor Post (1 permanent photo post, 10 Talents to swap)
--   2. Pinned Content (3 videos/photos, 3 audio waveforms)
--   3. Profile Visits (QT tracking with incognito detection)
--   4. CPR Counter (revival tracking after deactivation)
--   5. 4th Wall Breaks (COMA interaction for 100 Talents)
--   6. Profile Stats (with 13+/67+ caps for non-connections)
-- =====================================================

-- =====================================================
-- 1. ANCHOR POST TABLE
-- =====================================================
-- The 1 permanent photo post at the top of the profile
-- Users pay 10 Talents to swap it

CREATE TABLE IF NOT EXISTS anchor_posts (
  anchor_post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  image_url TEXT NOT NULL, -- Photo only, no videos
  caption TEXT, -- Optional text
  sound_id UUID, -- Optional 10s snippet (no FK - sounds table may not exist)
  sound_start_time INTEGER DEFAULT 0, -- Start time in seconds
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  swapped_at TIMESTAMPTZ, -- When it was last changed
  swap_count INTEGER DEFAULT 0, -- How many times swapped
  
  -- Moderation
  is_slashed BOOLEAN DEFAULT FALSE,
  slashed_by UUID REFERENCES auth.users(id),
  slashed_at TIMESTAMPTZ,
  slash_reason TEXT,
  
  -- Only 1 anchor post per user
  CONSTRAINT one_anchor_per_user UNIQUE(user_id)
);

CREATE INDEX idx_anchor_posts_user ON anchor_posts(user_id);
CREATE INDEX idx_anchor_posts_slashed ON anchor_posts(is_slashed) WHERE is_slashed = TRUE;

-- =====================================================
-- 2. PINNED CONTENT TABLE
-- =====================================================
-- 3 Pinned Videos/Photos (Tier 1)
-- 3 Audio Waveforms (Tier 2)

CREATE TABLE IF NOT EXISTS pinned_content (
  pinned_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content Type
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'photo', 'audio')),
  tier INTEGER NOT NULL CHECK (tier IN (1, 2)), -- Tier 1: video/photo, Tier 2: audio
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 3), -- 1, 2, or 3
  
  -- Content
  media_url TEXT NOT NULL,
  thumbnail_url TEXT, -- For videos
  caption TEXT,
  sound_id UUID, -- Optional sound (no FK - sounds table may not exist)
  duration_seconds INTEGER, -- For audio/video
  waveform_data JSONB, -- For audio waveforms
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Moderation
  is_slashed BOOLEAN DEFAULT FALSE,
  slashed_by UUID REFERENCES auth.users(id),
  slashed_at TIMESTAMPTZ,
  
  -- Unique constraint: each position within tier must be unique per user
  CONSTRAINT unique_tier_position UNIQUE(user_id, tier, position)
);

CREATE INDEX idx_pinned_content_user ON pinned_content(user_id);
CREATE INDEX idx_pinned_content_tier ON pinned_content(user_id, tier, position);

-- =====================================================
-- 3. PROFILE VISITS TABLE (QT Tracking)
-- =====================================================
-- Tracks dwell time on profile pages
-- The QT Blimp shows real-time dwell time

CREATE TABLE IF NOT EXISTS profile_visits (
  visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Whose profile
  visitor_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Who's viewing (NULL if logged out)
  
  -- Visit Details
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  dwell_seconds INTEGER DEFAULT 0, -- Total time spent
  
  -- Incognito Detection
  is_incognito BOOLEAN DEFAULT FALSE, -- If viewing in Stranger View mode
  
  -- Metadata
  user_agent TEXT,
  ip_address INET,
  
  -- Indexing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_visits_profile_user ON profile_visits(profile_user_id);
CREATE INDEX idx_profile_visits_visitor ON profile_visits(visitor_user_id);
CREATE INDEX idx_profile_visits_active ON profile_visits(profile_user_id) WHERE ended_at IS NULL;
CREATE INDEX idx_profile_visits_incognito ON profile_visits(profile_user_id, is_incognito) WHERE is_incognito = TRUE;

-- =====================================================
-- 4. CPR COUNTER TABLE
-- =====================================================
-- Tracks revival progress after deactivation (0/13 counter)

CREATE TABLE IF NOT EXISTS cpr_counters (
  cpr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- CPR Progress
  current_revivals INTEGER DEFAULT 0, -- 0 to 13
  max_revivals INTEGER DEFAULT 13,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ, -- When they reach 13/13
  expires_at TIMESTAMPTZ, -- CPR window expires after X days
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT one_cpr_per_user UNIQUE(user_id)
);

CREATE INDEX idx_cpr_counters_user ON cpr_counters(user_id);
CREATE INDEX idx_cpr_counters_active ON cpr_counters(user_id) WHERE is_active = TRUE;

-- =====================================================
-- 5. 4TH WALL BREAKS TABLE
-- =====================================================
-- Tracks when users break the 4th wall to message COMA users
-- Costs 100 Talents per interaction

CREATE TABLE IF NOT EXISTS fourth_wall_breaks (
  break_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Who paid
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- COMA user
  
  -- Payment
  talent_cost INTEGER DEFAULT 100,
  
  -- Message
  message_text TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_fourth_wall_sender ON fourth_wall_breaks(sender_id);
CREATE INDEX idx_fourth_wall_recipient ON fourth_wall_breaks(recipient_id);
CREATE INDEX idx_fourth_wall_unread ON fourth_wall_breaks(recipient_id) WHERE is_read = FALSE;

-- =====================================================
-- 6. CONNECTION CUTS TABLE (Snitch Alert)
-- =====================================================
-- Tracks when users "cut" connections from profile page
-- The Snitch protocol reveals the total QT (including negatives)

CREATE TABLE IF NOT EXISTS connection_cuts (
  cut_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cutter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Who cut
  cut_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Who was cut
  
  -- QT Reveal (The Snitch Protocol)
  total_qt_seconds INTEGER NOT NULL, -- Can be negative
  revealed_to_user BOOLEAN DEFAULT TRUE, -- Always true per protocol
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Context
  cut_from_page TEXT DEFAULT 'profile' -- Where the cut happened
);

CREATE INDEX idx_connection_cuts_cutter ON connection_cuts(cutter_id);
CREATE INDEX idx_connection_cuts_victim ON connection_cuts(cut_user_id);

-- =====================================================
-- 7. FUNCTIONS: Anchor Post Management
-- =====================================================

-- Function: Swap Anchor Post (costs 10 Talents)
CREATE OR REPLACE FUNCTION swap_anchor_post(
  p_user_id UUID,
  p_image_url TEXT,
  p_caption TEXT DEFAULT NULL,
  p_sound_id UUID DEFAULT NULL,
  p_sound_start_time INTEGER DEFAULT 0
) RETURNS JSON AS $$
DECLARE
  v_talent_balance INTEGER;
  v_anchor_exists BOOLEAN;
  v_result JSON;
BEGIN
  -- Check talent balance
  SELECT talent_balance INTO v_talent_balance
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_talent_balance < 10 THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Insufficient Talents',
      'required', 10,
      'balance', v_talent_balance
    );
  END IF;
  
  -- Check if anchor exists
  SELECT EXISTS(SELECT 1 FROM anchor_posts WHERE user_id = p_user_id) INTO v_anchor_exists;
  
  IF v_anchor_exists THEN
    -- Update existing anchor
    UPDATE anchor_posts
    SET
      image_url = p_image_url,
      caption = p_caption,
      sound_id = p_sound_id,
      sound_start_time = p_sound_start_time,
      swapped_at = NOW(),
      swap_count = swap_count + 1
    WHERE user_id = p_user_id;
    
    -- Deduct 10 Talents
    UPDATE profiles
    SET talent_balance = talent_balance - 10
    WHERE id = p_user_id;
  ELSE
    -- Create first anchor (free)
    INSERT INTO anchor_posts (user_id, image_url, caption, sound_id, sound_start_time)
    VALUES (p_user_id, p_image_url, p_caption, p_sound_id, p_sound_start_time);
  END IF;
  
  SELECT json_build_object(
    'success', TRUE,
    'is_first', NOT v_anchor_exists,
    'talents_spent', CASE WHEN v_anchor_exists THEN 10 ELSE 0 END,
    'new_balance', talent_balance
  )
  INTO v_result
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Anchor Post
CREATE OR REPLACE FUNCTION get_anchor_post(p_user_id UUID)
RETURNS TABLE (
  anchor_post_id UUID,
  image_url TEXT,
  caption TEXT,
  sound_id UUID,
  sound_name TEXT,
  sound_start_time INTEGER,
  created_at TIMESTAMPTZ,
  swapped_at TIMESTAMPTZ,
  swap_count INTEGER,
  is_slashed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.anchor_post_id,
    a.image_url,
    a.caption,
    a.sound_id,
    s.name AS sound_name,
    a.sound_start_time,
    a.created_at,
    a.swapped_at,
    a.swap_count,
    a.is_slashed
  FROM anchor_posts a
  LEFT JOIN sounds s ON a.sound_id = s.id
  WHERE a.user_id = p_user_id;
EXCEPTION
  WHEN undefined_table THEN
    -- Sounds table doesn't exist, return without sound name
    RETURN QUERY
    SELECT
      a.anchor_post_id,
      a.image_url,
      a.caption,
      a.sound_id,
      NULL::TEXT AS sound_name,
      a.sound_start_time,
      a.created_at,
      a.swapped_at,
      a.swap_count,
      a.is_slashed
    FROM anchor_posts a
    WHERE a.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FUNCTIONS: Pinned Content Management
-- =====================================================

-- Function: Pin Content
CREATE OR REPLACE FUNCTION pin_content(
  p_user_id UUID,
  p_content_type TEXT,
  p_tier INTEGER,
  p_position INTEGER,
  p_media_url TEXT,
  p_thumbnail_url TEXT DEFAULT NULL,
  p_caption TEXT DEFAULT NULL,
  p_sound_id UUID DEFAULT NULL,
  p_duration_seconds INTEGER DEFAULT NULL,
  p_waveform_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_pinned_id UUID;
BEGIN
  -- Upsert pinned content
  INSERT INTO pinned_content (
    user_id, content_type, tier, position, media_url,
    thumbnail_url, caption, sound_id, duration_seconds, waveform_data
  )
  VALUES (
    p_user_id, p_content_type, p_tier, p_position, p_media_url,
    p_thumbnail_url, p_caption, p_sound_id, p_duration_seconds, p_waveform_data
  )
  ON CONFLICT (user_id, tier, position)
  DO UPDATE SET
    content_type = EXCLUDED.content_type,
    media_url = EXCLUDED.media_url,
    thumbnail_url = EXCLUDED.thumbnail_url,
    caption = EXCLUDED.caption,
    sound_id = EXCLUDED.sound_id,
    duration_seconds = EXCLUDED.duration_seconds,
    waveform_data = EXCLUDED.waveform_data,
    pinned_at = NOW()
  RETURNING pinned_id INTO v_pinned_id;
  
  RETURN v_pinned_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Pinned Content
CREATE OR REPLACE FUNCTION get_pinned_content(p_user_id UUID)
RETURNS TABLE (
  pinned_id UUID,
  content_type TEXT,
  tier INTEGER,
  "position" INTEGER,
  media_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  sound_id UUID,
  sound_name TEXT,
  duration_seconds INTEGER,
  waveform_data JSONB,
  is_slashed BOOLEAN,
  pinned_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.pinned_id,
    p.content_type,
    p.tier,
    p.position,
    p.media_url,
    p.thumbnail_url,
    p.caption,
    p.sound_id,
    s.name AS sound_name,
    p.duration_seconds,
    p.waveform_data,
    p.is_slashed,
    p.pinned_at
  FROM pinned_content p
  LEFT JOIN sounds s ON p.sound_id = s.id
  WHERE p.user_id = p_user_id
  ORDER BY p.tier, p.position;
EXCEPTION
  WHEN undefined_table THEN
    -- Sounds table doesn't exist, return without sound name
    RETURN QUERY
    SELECT
      p.pinned_id,
      p.content_type,
      p.tier,
      p.position,
      p.media_url,
      p.thumbnail_url,
      p.caption,
      p.sound_id,
      NULL::TEXT AS sound_name,
      p.duration_seconds,
      p.waveform_data,
      p.is_slashed,
      p.pinned_at
    FROM pinned_content p
    WHERE p.user_id = p_user_id
    ORDER BY p.tier, p.position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. FUNCTIONS: QT Tracking (Profile Visits)
-- =====================================================

-- Function: Start Profile Visit
CREATE OR REPLACE FUNCTION start_profile_visit(
  p_profile_user_id UUID,
  p_visitor_user_id UUID DEFAULT NULL,
  p_is_incognito BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
  v_visit_id UUID;
BEGIN
  INSERT INTO profile_visits (profile_user_id, visitor_user_id, is_incognito)
  VALUES (p_profile_user_id, p_visitor_user_id, p_is_incognito)
  RETURNING visit_id INTO v_visit_id;
  
  RETURN v_visit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update Profile Visit (increase dwell time)
CREATE OR REPLACE FUNCTION update_profile_visit(
  p_visit_id UUID,
  p_additional_seconds INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE profile_visits
  SET dwell_seconds = dwell_seconds + p_additional_seconds
  WHERE visit_id = p_visit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: End Profile Visit
CREATE OR REPLACE FUNCTION end_profile_visit(p_visit_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total_seconds INTEGER;
BEGIN
  UPDATE profile_visits
  SET ended_at = NOW()
  WHERE visit_id = p_visit_id
  RETURNING dwell_seconds INTO v_total_seconds;
  
  RETURN v_total_seconds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Total QT for User (sum of all visits)
CREATE OR REPLACE FUNCTION get_total_qt(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total_qt INTEGER;
BEGIN
  SELECT COALESCE(SUM(dwell_seconds), 0)
  INTO v_total_qt
  FROM profile_visits
  WHERE profile_user_id = p_user_id;
  
  RETURN v_total_qt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Active Visitors (for QT Blimp)
CREATE OR REPLACE FUNCTION get_active_visitors(p_user_id UUID)
RETURNS TABLE (
  visit_id UUID,
  visitor_user_id UUID,
  visitor_username TEXT,
  visitor_profile_photo TEXT,
  dwell_seconds INTEGER,
  is_incognito BOOLEAN,
  started_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.visit_id,
    pv.visitor_user_id,
    u.raw_user_meta_data->>'username' AS visitor_username,
    NULL::TEXT AS visitor_profile_photo,
    pv.dwell_seconds,
    pv.is_incognito,
    pv.started_at
  FROM profile_visits pv
  LEFT JOIN auth.users u ON pv.visitor_user_id = u.id
  WHERE pv.profile_user_id = p_user_id
    AND pv.ended_at IS NULL
  ORDER BY pv.started_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. FUNCTIONS: CPR Counter
-- =====================================================

-- Function: Start CPR Counter (after deactivation)
CREATE OR REPLACE FUNCTION start_cpr_counter(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_cpr_id UUID;
BEGIN
  -- Deactivate any existing CPR counters
  UPDATE cpr_counters
  SET is_active = FALSE
  WHERE user_id = p_user_id;
  
  -- Create new CPR counter
  INSERT INTO cpr_counters (user_id, expires_at)
  VALUES (p_user_id, NOW() + INTERVAL '30 days')
  RETURNING cpr_id INTO v_cpr_id;
  
  RETURN v_cpr_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment CPR Counter (each revival interaction)
CREATE OR REPLACE FUNCTION increment_cpr(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_current INTEGER;
  v_max INTEGER;
  v_completed BOOLEAN;
BEGIN
  UPDATE cpr_counters
  SET current_revivals = current_revivals + 1,
      completed_at = CASE WHEN current_revivals + 1 >= max_revivals THEN NOW() ELSE NULL END
  WHERE user_id = p_user_id
    AND is_active = TRUE
  RETURNING current_revivals, max_revivals, completed_at IS NOT NULL
  INTO v_current, v_max, v_completed;
  
  RETURN json_build_object(
    'current', v_current,
    'max', v_max,
    'completed', v_completed,
    'remaining', v_max - v_current
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get CPR Status
CREATE OR REPLACE FUNCTION get_cpr_status(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'current', current_revivals,
    'max', max_revivals,
    'is_active', is_active,
    'expires_at', expires_at,
    'completed_at', completed_at
  )
  INTO v_result
  FROM cpr_counters
  WHERE user_id = p_user_id
    AND is_active = TRUE;
  
  RETURN COALESCE(v_result, json_build_object('is_active', FALSE));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. FUNCTIONS: 4th Wall Break (COMA Interaction)
-- =====================================================

-- Function: Break 4th Wall (costs 100 Talents)
CREATE OR REPLACE FUNCTION break_fourth_wall(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_message_text TEXT
) RETURNS JSON AS $$
DECLARE
  v_sender_balance INTEGER;
  v_recipient_is_coma BOOLEAN;
  v_break_id UUID;
BEGIN
  -- Check sender's talent balance
  SELECT talent_balance INTO v_sender_balance
  FROM profiles
  WHERE id = p_sender_id;
  
  IF v_sender_balance < 100 THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Insufficient Talents',
      'required', 100,
      'balance', v_sender_balance
    );
  END IF;
  
  -- Check recipient is in COMA
  SELECT coma_status INTO v_recipient_is_coma
  FROM profiles
  WHERE id = p_recipient_id;
  
  IF NOT v_recipient_is_coma THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'User is not in COMA'
    );
  END IF;
  
  -- Create 4th wall break
  INSERT INTO fourth_wall_breaks (sender_id, recipient_id, message_text)
  VALUES (p_sender_id, p_recipient_id, p_message_text)
  RETURNING break_id INTO v_break_id;
  
  -- Deduct 100 Talents from sender
  UPDATE profiles
  SET talent_balance = talent_balance - 100
  WHERE id = p_sender_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'break_id', v_break_id,
    'talents_spent', 100,
    'new_balance', v_sender_balance - 100
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get 4th Wall Breaks (for recipient)
CREATE OR REPLACE FUNCTION get_fourth_wall_breaks(p_user_id UUID)
RETURNS TABLE (
  break_id UUID,
  sender_id UUID,
  sender_username TEXT,
  sender_photo TEXT,
  message_text TEXT,
  created_at TIMESTAMPTZ,
  is_read BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fw.break_id,
    fw.sender_id,
    u.raw_user_meta_data->>'username' AS sender_username,
    NULL::TEXT AS sender_photo,
    fw.message_text,
    fw.created_at,
    fw.is_read
  FROM fourth_wall_breaks fw
  LEFT JOIN auth.users u ON fw.sender_id = u.id
  WHERE fw.recipient_id = p_user_id
  ORDER BY fw.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. FUNCTIONS: Connection Cut (Snitch Protocol)
-- =====================================================

-- Function: Cut Connection (triggers Snitch Alert)
CREATE OR REPLACE FUNCTION cut_connection(
  p_cutter_id UUID,
  p_cut_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_total_qt INTEGER;
  v_cut_id UUID;
BEGIN
  -- Calculate total QT (can be negative)
  SELECT COALESCE(SUM(
    CASE 
      WHEN visitor_user_id = p_cutter_id THEN dwell_seconds
      WHEN visitor_user_id = p_cut_user_id THEN -dwell_seconds
      ELSE 0
    END
  ), 0)
  INTO v_total_qt
  FROM profile_visits
  WHERE (profile_user_id = p_cut_user_id AND visitor_user_id = p_cutter_id)
     OR (profile_user_id = p_cutter_id AND visitor_user_id = p_cut_user_id);
  
  -- Record the cut (Snitch Protocol)
  INSERT INTO connection_cuts (cutter_id, cut_user_id, total_qt_seconds)
  VALUES (p_cutter_id, p_cut_user_id, v_total_qt)
  RETURNING cut_id INTO v_cut_id;
  
  -- Remove connection from connections table (if exists)
  BEGIN
    DELETE FROM connections
    WHERE (user_id = p_cutter_id AND connected_user_id = p_cut_user_id)
       OR (user_id = p_cut_user_id AND connected_user_id = p_cutter_id);
  EXCEPTION
    WHEN undefined_table THEN
      NULL; -- Connections table doesn't exist yet
  END;
  
  RETURN json_build_object(
    'success', TRUE,
    'cut_id', v_cut_id,
    'revealed_qt', v_total_qt,
    'qt_display', CASE 
      WHEN v_total_qt >= 0 THEN '+' || v_total_qt
      ELSE v_total_qt::TEXT
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 13. FUNCTIONS: Profile Stats (with 13+/67+ caps)
-- =====================================================

-- Function: Get Profile Stats (respects Stranger View)
CREATE OR REPLACE FUNCTION get_profile_stats(
  p_profile_user_id UUID,
  p_viewer_user_id UUID DEFAULT NULL,
  p_is_stranger_view BOOLEAN DEFAULT FALSE
) RETURNS JSON AS $$
DECLARE
  v_total_likes INTEGER;
  v_total_huemans INTEGER;
  v_total_connections INTEGER;
  v_is_connected BOOLEAN;
  v_likes_display TEXT;
  v_huemans_display TEXT;
BEGIN
  -- Default to not connected and zero counts
  v_is_connected := FALSE;
  v_total_likes := 0;
  v_total_huemans := 0;
  v_total_connections := 0;
  
  -- Check if viewer is connected (connections table may not exist)
  IF p_viewer_user_id IS NOT NULL THEN
    BEGIN
      SELECT EXISTS(
        SELECT 1 FROM connections
        WHERE (user_id = p_viewer_user_id AND connected_user_id = p_profile_user_id)
           OR (user_id = p_profile_user_id AND connected_user_id = p_viewer_user_id)
      ) INTO v_is_connected;
    EXCEPTION
      WHEN undefined_table THEN
        v_is_connected := FALSE;
    END;
  END IF;
  
  -- Get actual counts (posts/connections tables may not exist)
  BEGIN
    SELECT
      COALESCE(SUM(like_count), 0),
      COUNT(DISTINCT p.user_id),
      (SELECT COUNT(*) FROM connections WHERE user_id = p_profile_user_id)
    INTO v_total_likes, v_total_huemans, v_total_connections
    FROM posts p
    WHERE p.user_id = p_profile_user_id;
  EXCEPTION
    WHEN undefined_table THEN
      NULL; -- Keep defaults (0, 0, 0)
  END;
  
  -- Apply 13+/67+ caps if not connected or in stranger view
  IF NOT v_is_connected OR p_is_stranger_view THEN
    v_likes_display := CASE WHEN v_total_likes > 13 THEN '13+' ELSE v_total_likes::TEXT END;
    v_huemans_display := CASE WHEN v_total_huemans > 67 THEN '67+' ELSE v_total_huemans::TEXT END;
  ELSE
    v_likes_display := v_total_likes::TEXT;
    v_huemans_display := v_total_huemans::TEXT;
  END IF;
  
  RETURN json_build_object(
    'likes', v_total_likes,
    'likes_display', v_likes_display,
    'huemans', v_total_huemans,
    'huemans_display', v_huemans_display,
    'connections', v_total_connections,
    'is_connected', v_is_connected
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 14. ADMIN FUNCTIONS: God-Mode Overrides
-- =====================================================

-- Function: Admin Slash Content
CREATE OR REPLACE FUNCTION admin_slash_content(
  p_admin_user_id UUID,
  p_content_type TEXT, -- 'anchor' or 'pinned'
  p_content_id UUID,
  p_slash_reason TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verify admin status
  SELECT is_admin INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_user_id;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', FALSE, 'error', 'Unauthorized');
  END IF;
  
  IF p_content_type = 'anchor' THEN
    UPDATE anchor_posts
    SET
      is_slashed = TRUE,
      slashed_by = p_admin_user_id,
      slashed_at = NOW(),
      slash_reason = p_slash_reason
    WHERE anchor_post_id = p_content_id;
  ELSIF p_content_type = 'pinned' THEN
    UPDATE pinned_content
    SET
      is_slashed = TRUE,
      slashed_by = p_admin_user_id,
      slashed_at = NOW()
    WHERE pinned_id = p_content_id;
  ELSE
    RETURN json_build_object('success', FALSE, 'error', 'Invalid content type');
  END IF;
  
  RETURN json_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Admin Inject Talents
CREATE OR REPLACE FUNCTION admin_inject_talents(
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_talent_amount INTEGER, -- Can be negative
  p_reason TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_new_balance INTEGER;
BEGIN
  -- Verify admin status
  SELECT is_admin INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_user_id;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', FALSE, 'error', 'Unauthorized');
  END IF;
  
  -- Update talent balance
  UPDATE profiles
  SET talent_balance = talent_balance + p_talent_amount
  WHERE id = p_target_user_id
  RETURNING talent_balance INTO v_new_balance;
  
  -- Log the injection (optional: create admin_actions table)
  -- INSERT INTO admin_actions (admin_id, action_type, target_user_id, details)
  -- VALUES (p_admin_user_id, 'talent_injection', p_target_user_id, 
  --         json_build_object('amount', p_talent_amount, 'reason', p_reason));
  
  RETURN json_build_object(
    'success', TRUE,
    'new_balance', v_new_balance,
    'amount_changed', p_talent_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 15. RLS POLICIES
-- =====================================================

-- Anchor Posts: Public read, owner edit
ALTER TABLE anchor_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anchor posts are viewable by everyone"
  ON anchor_posts FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own anchor post"
  ON anchor_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anchor post"
  ON anchor_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anchor post"
  ON anchor_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Pinned Content: Public read, owner edit
ALTER TABLE pinned_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pinned content is viewable by everyone"
  ON pinned_content FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own pinned content"
  ON pinned_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pinned content"
  ON pinned_content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pinned content"
  ON pinned_content FOR DELETE
  USING (auth.uid() = user_id);

-- Profile Visits: Owner can view their visits
ALTER TABLE profile_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view visits to their profile"
  ON profile_visits FOR SELECT
  USING (auth.uid() = profile_user_id OR auth.uid() = visitor_user_id);

CREATE POLICY "Anyone can insert profile visits"
  ON profile_visits FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Visitors can update their own visits"
  ON profile_visits FOR UPDATE
  USING (auth.uid() = visitor_user_id OR visitor_user_id IS NULL);

CREATE POLICY "Users can delete their profile visits"
  ON profile_visits FOR DELETE
  USING (auth.uid() = profile_user_id OR auth.uid() = visitor_user_id);

-- CPR Counters: System managed
ALTER TABLE cpr_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own CPR counter"
  ON cpr_counters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert CPR counters"
  ON cpr_counters FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "System can update CPR counters"
  ON cpr_counters FOR UPDATE
  USING (TRUE);

CREATE POLICY "System can delete CPR counters"
  ON cpr_counters FOR DELETE
  USING (TRUE);

-- 4th Wall Breaks: Sender and recipient can view
ALTER TABLE fourth_wall_breaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view 4th wall breaks they sent or received"
  ON fourth_wall_breaks FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send 4th wall breaks"
  ON fourth_wall_breaks FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update 4th wall breaks"
  ON fourth_wall_breaks FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Connection Cuts: Both parties can view
ALTER TABLE connection_cuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their connection cuts"
  ON connection_cuts FOR SELECT
  USING (auth.uid() = cutter_id OR auth.uid() = cut_user_id);

CREATE POLICY "Users can record connection cuts"
  ON connection_cuts FOR INSERT
  WITH CHECK (auth.uid() = cutter_id);

-- =====================================================
-- END OF MIGRATION
-- =====================================================
