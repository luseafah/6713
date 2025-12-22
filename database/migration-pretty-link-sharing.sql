-- =====================================================
-- 6713 PROTOCOL: PRETTY LINK SHARING SYSTEM
-- =====================================================
-- When verified users share a post from Hue (For You) to the Wall,
-- they aren't just sending a link; they are "throwing" the post.
-- Visual: Pretty Link maintains original Hue aspect ratio (15s video or Photo)
-- Display: Artist's Stylized Typography for sound name
-- Action: One-Tap Redirect back to original Artist's Sound Page
-- =====================================================

-- =====================================================
-- 1. SHARED POSTS (PRETTY LINKS)
-- =====================================================

CREATE TABLE IF NOT EXISTS shared_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sharer_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  original_post_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE NOT NULL,
  original_artist_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Pretty Link Display Data
  preview_media_url TEXT NOT NULL, -- Thumbnail or video preview
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  aspect_ratio NUMERIC(5, 3) DEFAULT 1.778, -- 16:9 = 1.778, preserve original ratio
  sound_name TEXT NOT NULL, -- Artist's sound/track name
  artist_username TEXT NOT NULL, -- For attribution
  artist_typography_style JSONB DEFAULT '{}', -- Custom font styling from artist
  
  -- Metadata
  share_message TEXT, -- Optional message from sharer
  wall_message_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE, -- Wall post created for this share
  
  -- Stats
  tap_count INTEGER DEFAULT 0, -- How many times the Pretty Link was tapped
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_posts_sharer ON shared_posts(sharer_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_posts_original ON shared_posts(original_post_id);
CREATE INDEX IF NOT EXISTS idx_shared_posts_artist ON shared_posts(original_artist_id);
CREATE INDEX IF NOT EXISTS idx_shared_posts_wall_msg ON shared_posts(wall_message_id);
CREATE INDEX IF NOT EXISTS idx_shared_posts_created ON shared_posts(created_at DESC);

-- =====================================================
-- 2. ARTIST TYPOGRAPHY STYLES
-- =====================================================
-- Store custom typography styles for artists (verified users)

CREATE TABLE IF NOT EXISTS artist_typography_styles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  font_family TEXT DEFAULT 'Inter',
  font_weight TEXT DEFAULT '600',
  font_size TEXT DEFAULT '1.125rem', -- 18px
  text_color TEXT DEFAULT '#FFFFFF',
  text_shadow TEXT DEFAULT '0 2px 8px rgba(0,0,0,0.8)',
  letter_spacing TEXT DEFAULT '0.05em',
  text_transform TEXT DEFAULT 'uppercase',
  custom_css JSONB DEFAULT '{}', -- Additional custom CSS properties
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. FUNCTIONS: SHARE TO WALL AS PRETTY LINK
-- =====================================================

-- Function: Share Post to Wall (Create Pretty Link)
CREATE OR REPLACE FUNCTION share_post_to_wall(
  p_sharer_user_id UUID,
  p_original_post_id UUID,
  p_share_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_verified BOOLEAN;
  v_original_post RECORD;
  v_artist_style RECORD;
  v_wall_message_id UUID;
  v_shared_post_id UUID;
BEGIN
  -- Check if sharer is verified
  SELECT verified_at IS NOT NULL INTO v_is_verified
  FROM profiles
  WHERE id = p_sharer_user_id;
  
  IF NOT v_is_verified THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Only verified users can share to Wall'
    );
  END IF;

  -- Get original post details
  SELECT 
    wm.id,
    wm.user_id,
    wm.username,
    wm.content,
    wm.media_url,
    wm.message_type,
    u.username as artist_username
  INTO v_original_post
  FROM wall_messages wm
  JOIN users u ON wm.user_id = u.id
  WHERE wm.id = p_original_post_id;
  
  IF v_original_post IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Original post not found');
  END IF;

  -- Get artist typography style
  SELECT * INTO v_artist_style
  FROM artist_typography_styles
  WHERE user_id = v_original_post.user_id;
  
  -- If artist has no custom style, use defaults
  IF v_artist_style IS NULL THEN
    v_artist_style := ROW(
      v_original_post.user_id,
      'Inter',
      '600',
      '1.125rem',
      '#FFFFFF',
      '0 2px 8px rgba(0,0,0,0.8)',
      '0.05em',
      'uppercase',
      '{}',
      NOW(),
      NOW()
    )::artist_typography_styles;
  END IF;
  
  -- Create Wall message for the shared post
  INSERT INTO wall_messages (
    user_id, 
    username, 
    content, 
    message_type, 
    post_type,
    is_permanent
  ) VALUES (
    p_sharer_user_id,
    (SELECT username FROM users WHERE id = p_sharer_user_id),
    COALESCE(p_share_message, '🔗 Shared a Pretty Link'),
    'system',
    'wall',
    false
  )
  RETURNING id INTO v_wall_message_id;
  
  -- Create shared post (Pretty Link) record
  INSERT INTO shared_posts (
    sharer_user_id,
    original_post_id,
    original_artist_id,
    preview_media_url,
    media_type,
    sound_name,
    artist_username,
    artist_typography_style,
    share_message,
    wall_message_id
  ) VALUES (
    p_sharer_user_id,
    p_original_post_id,
    v_original_post.user_id,
    v_original_post.media_url,
    CASE 
      WHEN v_original_post.message_type = 'picture' THEN 'photo'
      WHEN v_original_post.message_type = 'voice' THEN 'video'
      ELSE 'photo'
    END,
    v_original_post.content, -- Sound/track name
    v_original_post.artist_username,
    jsonb_build_object(
      'fontFamily', v_artist_style.font_family,
      'fontWeight', v_artist_style.font_weight,
      'fontSize', v_artist_style.font_size,
      'color', v_artist_style.text_color,
      'textShadow', v_artist_style.text_shadow,
      'letterSpacing', v_artist_style.letter_spacing,
      'textTransform', v_artist_style.text_transform,
      'customCss', v_artist_style.custom_css
    ),
    p_share_message,
    v_wall_message_id
  )
  RETURNING id INTO v_shared_post_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'shared_post_id', v_shared_post_id,
    'wall_message_id', v_wall_message_id
  );
END;
$$;

-- Function: Track Pretty Link Tap
CREATE OR REPLACE FUNCTION track_pretty_link_tap(
  p_shared_post_id UUID,
  p_tapper_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_original_post_id UUID;
  v_artist_id UUID;
BEGIN
  -- Increment tap count
  UPDATE shared_posts
  SET tap_count = tap_count + 1
  WHERE id = p_shared_post_id
  RETURNING original_post_id, original_artist_id INTO v_original_post_id, v_artist_id;
  
  IF v_original_post_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shared post not found');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'redirect_to_artist_id', v_artist_id,
    'redirect_to_post_id', v_original_post_id
  );
END;
$$;

-- Function: Set Artist Typography Style (Verified Users Only)
CREATE OR REPLACE FUNCTION set_artist_typography(
  p_user_id UUID,
  p_font_family TEXT DEFAULT NULL,
  p_font_weight TEXT DEFAULT NULL,
  p_font_size TEXT DEFAULT NULL,
  p_text_color TEXT DEFAULT NULL,
  p_text_shadow TEXT DEFAULT NULL,
  p_letter_spacing TEXT DEFAULT NULL,
  p_text_transform TEXT DEFAULT NULL,
  p_custom_css JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_verified BOOLEAN;
BEGIN
  -- Check if user is verified
  SELECT verified_at IS NOT NULL INTO v_is_verified
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT v_is_verified THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Only verified users can customize typography'
    );
  END IF;

  -- Upsert typography style
  INSERT INTO artist_typography_styles (
    user_id, font_family, font_weight, font_size, text_color,
    text_shadow, letter_spacing, text_transform, custom_css, updated_at
  ) VALUES (
    p_user_id,
    COALESCE(p_font_family, 'Inter'),
    COALESCE(p_font_weight, '600'),
    COALESCE(p_font_size, '1.125rem'),
    COALESCE(p_text_color, '#FFFFFF'),
    COALESCE(p_text_shadow, '0 2px 8px rgba(0,0,0,0.8)'),
    COALESCE(p_letter_spacing, '0.05em'),
    COALESCE(p_text_transform, 'uppercase'),
    COALESCE(p_custom_css, '{}'::jsonb),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    font_family = COALESCE(EXCLUDED.font_family, artist_typography_styles.font_family),
    font_weight = COALESCE(EXCLUDED.font_weight, artist_typography_styles.font_weight),
    font_size = COALESCE(EXCLUDED.font_size, artist_typography_styles.font_size),
    text_color = COALESCE(EXCLUDED.text_color, artist_typography_styles.text_color),
    text_shadow = COALESCE(EXCLUDED.text_shadow, artist_typography_styles.text_shadow),
    letter_spacing = COALESCE(EXCLUDED.letter_spacing, artist_typography_styles.letter_spacing),
    text_transform = COALESCE(EXCLUDED.text_transform, artist_typography_styles.text_transform),
    custom_css = COALESCE(EXCLUDED.custom_css, artist_typography_styles.custom_css),
    updated_at = NOW();
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Shared Posts: Anyone can view, only verified users can create
ALTER TABLE shared_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shared_posts_public_view ON shared_posts;
CREATE POLICY shared_posts_public_view ON shared_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS shared_posts_verified_create ON shared_posts;
CREATE POLICY shared_posts_verified_create ON shared_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND verified_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS shared_posts_owner_update ON shared_posts;
CREATE POLICY shared_posts_owner_update ON shared_posts
  FOR UPDATE USING (auth.uid() = sharer_user_id);

-- Artist Typography Styles: Public view, owner can edit
ALTER TABLE artist_typography_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS artist_typography_public_view ON artist_typography_styles;
CREATE POLICY artist_typography_public_view ON artist_typography_styles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS artist_typography_owner_edit ON artist_typography_styles;
CREATE POLICY artist_typography_owner_edit ON artist_typography_styles
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 5. UPDATE WALL_MESSAGES FOR PRETTY LINK INTEGRATION
-- =====================================================

-- Add column to track if a wall message is a Pretty Link
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wall_messages' 
    AND column_name = 'is_pretty_link'
  ) THEN
    ALTER TABLE wall_messages ADD COLUMN is_pretty_link BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wall_messages' 
    AND column_name = 'shared_post_id'
  ) THEN
    ALTER TABLE wall_messages ADD COLUMN shared_post_id UUID REFERENCES shared_posts(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wall_messages_pretty_link ON wall_messages(is_pretty_link) WHERE is_pretty_link = TRUE;
CREATE INDEX IF NOT EXISTS idx_wall_messages_shared_post ON wall_messages(shared_post_id) WHERE shared_post_id IS NOT NULL;

-- =====================================================
-- 6. VIEWS: PRETTY LINK ANALYTICS
-- =====================================================

-- View: Most Shared Artists
CREATE OR REPLACE VIEW most_shared_artists AS
SELECT 
  u.id as artist_id,
  u.username,
  COUNT(sp.id) as share_count,
  SUM(sp.tap_count) as total_taps,
  AVG(sp.tap_count) as avg_taps_per_share
FROM shared_posts sp
JOIN users u ON sp.original_artist_id = u.id
GROUP BY u.id, u.username
ORDER BY share_count DESC;

-- View: Wall Pretty Links Feed
CREATE OR REPLACE VIEW wall_pretty_links_feed AS
SELECT 
  sp.id as shared_post_id,
  sp.preview_media_url,
  sp.media_type,
  sp.sound_name,
  sp.artist_username,
  sp.artist_typography_style,
  sp.share_message,
  sp.tap_count,
  sp.created_at,
  wm.id as wall_message_id,
  sharer.username as sharer_username
FROM shared_posts sp
JOIN wall_messages wm ON sp.wall_message_id = wm.id
JOIN users sharer ON sp.sharer_user_id = sharer.id
WHERE wm.is_pretty_link = TRUE
ORDER BY sp.created_at DESC;

-- =====================================================
-- PROTOCOL NOTICE: PRETTY LINK SYSTEM
-- =====================================================
-- Sharing: Verified users "throw" posts from Hue to Wall
-- Display: Pretty Link with original aspect ratio (15s video or Photo)
-- Typography: Artist's custom stylized text for sound name
-- Interaction: One-Tap Redirect to original Artist's Sound Page
-- Gallery: Wall becomes high-quality curated Pretty Link gallery
-- =====================================================
