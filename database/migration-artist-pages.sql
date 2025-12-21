-- =====================================================
-- ARTIST PAGE SYSTEM - THE 6713 RULE
-- =====================================================
-- Implements the Artist Page architecture with:
-- - 3 Sound Snippets per artist (10s max)
-- - Elite 6 Gallery (only 6 videos per sound)
-- - Verified Favorites (max 5 sounds)
-- - Anchor Post (1 permanent photo)
-- - Watch History (10 videos max)
-- - Activity Log with expiration tracking

-- =====================================================
-- 1. ARTIST PROFILES (ENHANCED)
-- =====================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_artist BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS artist_bio TEXT,
ADD COLUMN IF NOT EXISTS featured_videos UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pinned_count INTEGER DEFAULT 0,
ADD CONSTRAINT max_pinned_videos CHECK (pinned_count <= 3);

COMMENT ON COLUMN profiles.is_artist IS 'Artist status unlocks 3 sounds and Elite 6 gallery';
COMMENT ON COLUMN profiles.featured_videos IS 'Array of 3 pinned video IDs for Featured Grid';
COMMENT ON COLUMN profiles.pinned_count IS 'Current count of pinned videos (max 3)';

CREATE INDEX IF NOT EXISTS idx_profiles_is_artist ON profiles(is_artist) WHERE is_artist = true;

-- =====================================================
-- 2. SOUND SNIPPETS (3 PER ARTIST)
-- =====================================================

CREATE TABLE IF NOT EXISTS sound_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    duration_seconds INTEGER CHECK (duration_seconds <= 10),
    external_link TEXT,
    sort_order INTEGER DEFAULT 0,
    play_count BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT max_sounds_per_artist UNIQUE (artist_id, sort_order),
    CONSTRAINT valid_sort_order CHECK (sort_order BETWEEN 0 AND 2)
);

COMMENT ON TABLE sound_snippets IS 'Artist sound library - max 3 sounds at 10s each';
COMMENT ON COLUMN sound_snippets.sort_order IS '0-2 for the 3 sound slots';
COMMENT ON COLUMN sound_snippets.external_link IS 'Commerce or full track link';

CREATE INDEX idx_sound_snippets_artist ON sound_snippets(artist_id);

-- Enforce max 3 sounds per artist
CREATE OR REPLACE FUNCTION check_artist_sound_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM sound_snippets WHERE artist_id = NEW.artist_id) >= 3 THEN
        RAISE EXCEPTION 'Artist can only have 3 sound snippets maximum';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_sound_limit
    BEFORE INSERT ON sound_snippets
    FOR EACH ROW
    EXECUTE FUNCTION check_artist_sound_limit();

-- =====================================================
-- 3. ELITE 6 GALLERY (6 VIDEOS PER SOUND)
-- =====================================================

CREATE TABLE IF NOT EXISTS elite_6_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sound_id UUID NOT NULL REFERENCES sound_snippets(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quality_score INTEGER DEFAULT 0,
    slot_number INTEGER CHECK (slot_number BETWEEN 1 AND 6),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_video_per_sound UNIQUE (sound_id, video_id),
    CONSTRAINT unique_slot_per_sound UNIQUE (sound_id, slot_number)
);

COMMENT ON TABLE elite_6_videos IS 'The Elite 6 - only 6 videos allowed per sound';
COMMENT ON COLUMN elite_6_videos.quality_score IS 'Used to determine "weakest link" when replacing';
COMMENT ON COLUMN elite_6_videos.slot_number IS '1-6 gallery positions';

CREATE INDEX idx_elite_6_sound ON elite_6_videos(sound_id);
CREATE INDEX idx_elite_6_creator ON elite_6_videos(creator_id);

-- Function to add video to Elite 6 (replaces weakest if full)
CREATE OR REPLACE FUNCTION add_to_elite_6(
    p_sound_id UUID,
    p_video_id UUID,
    p_creator_id UUID,
    p_quality_score INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_count INTEGER;
    v_weakest_id UUID;
    v_weakest_score INTEGER;
    v_next_slot INTEGER;
    v_result JSONB;
BEGIN
    -- Check current count
    SELECT COUNT(*) INTO v_current_count
    FROM elite_6_videos
    WHERE sound_id = p_sound_id;
    
    -- If less than 6, just add it
    IF v_current_count < 6 THEN
        v_next_slot := v_current_count + 1;
        
        INSERT INTO elite_6_videos (sound_id, video_id, creator_id, quality_score, slot_number)
        VALUES (p_sound_id, p_video_id, p_creator_id, p_quality_score, v_next_slot);
        
        v_result := jsonb_build_object(
            'success', true,
            'action', 'added',
            'slot_number', v_next_slot,
            'message', 'Video added to Elite 6'
        );
    ELSE
        -- Gallery full - find weakest link
        SELECT id, quality_score
        INTO v_weakest_id, v_weakest_score
        FROM elite_6_videos
        WHERE sound_id = p_sound_id
        ORDER BY quality_score ASC, created_at ASC
        LIMIT 1;
        
        -- Return prompt to user
        v_result := jsonb_build_object(
            'success', false,
            'action', 'prompt_replace',
            'weakest_id', v_weakest_id,
            'weakest_score', v_weakest_score,
            'message', 'The Elite 6 are full. Replace the weakest link?'
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- Function to replace video in Elite 6
CREATE OR REPLACE FUNCTION replace_elite_6_video(
    p_sound_id UUID,
    p_old_video_id UUID,
    p_new_video_id UUID,
    p_creator_id UUID,
    p_quality_score INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slot INTEGER;
BEGIN
    -- Get slot number of old video
    SELECT slot_number INTO v_slot
    FROM elite_6_videos
    WHERE sound_id = p_sound_id AND video_id = p_old_video_id;
    
    -- Delete old video
    DELETE FROM elite_6_videos
    WHERE sound_id = p_sound_id AND video_id = p_old_video_id;
    
    -- Insert new video in same slot
    INSERT INTO elite_6_videos (sound_id, video_id, creator_id, quality_score, slot_number)
    VALUES (p_sound_id, p_new_video_id, p_creator_id, p_quality_score, v_slot);
    
    RETURN jsonb_build_object(
        'success', true,
        'action', 'replaced',
        'slot_number', v_slot,
        'message', 'Video replaced in Elite 6'
    );
END;
$$;

-- =====================================================
-- 4. VERIFIED FAVORITES (MAX 5 SOUNDS)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sound_id UUID NOT NULL REFERENCES sound_snippets(id) ON DELETE CASCADE,
    favorited_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_sound_favorite UNIQUE (user_id, sound_id)
);

COMMENT ON TABLE user_favorites IS 'Verified users can favorite max 5 sounds (The Jukebox)';

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);

-- Enforce max 5 favorites per user
CREATE OR REPLACE FUNCTION check_favorite_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_is_verified BOOLEAN;
    v_favorite_count INTEGER;
BEGIN
    -- Check if user is verified
    SELECT verification_status = 'verified' INTO v_is_verified
    FROM profiles
    WHERE id = NEW.user_id;
    
    IF NOT v_is_verified THEN
        RAISE EXCEPTION 'Only verified users can favorite sounds';
    END IF;
    
    -- Check count
    SELECT COUNT(*) INTO v_favorite_count
    FROM user_favorites
    WHERE user_id = NEW.user_id;
    
    IF v_favorite_count >= 5 THEN
        RAISE EXCEPTION 'Users can only favorite 5 sounds maximum';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_favorite_limit
    BEFORE INSERT ON user_favorites
    FOR EACH ROW
    EXECUTE FUNCTION check_favorite_limit();

-- =====================================================
-- 5. ANCHOR POST (1 PERMANENT PHOTO PER USER)
-- =====================================================

CREATE TABLE IF NOT EXISTS anchor_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    sound_snippet_id UUID REFERENCES sound_snippets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT no_video_in_anchor CHECK (photo_url !~ '\.mp4$|\.mov$|\.avi$')
);

COMMENT ON TABLE anchor_posts IS 'One permanent photo post per user - the Cover Page';
COMMENT ON COLUMN anchor_posts.sound_snippet_id IS 'Optional 10s sound attachment';

CREATE INDEX idx_anchor_posts_user ON anchor_posts(user_id);

-- Ensure only 1 anchor post per user
CREATE OR REPLACE FUNCTION check_anchor_post_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM anchor_posts WHERE user_id = NEW.user_id) THEN
        RAISE EXCEPTION 'User can only have 1 anchor post';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_anchor_limit
    BEFORE INSERT ON anchor_posts
    FOR EACH ROW
    EXECUTE FUNCTION check_anchor_post_limit();

-- =====================================================
-- 6. WATCH HISTORY (10 VIDEOS MAX)
-- =====================================================

CREATE TABLE IF NOT EXISTS watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    watched_at TIMESTAMPTZ DEFAULT NOW(),
    watch_duration_seconds INTEGER,
    
    CONSTRAINT unique_user_video_watch UNIQUE (user_id, video_id, watched_at)
);

COMMENT ON TABLE watch_history IS '10-video watch history - prevents endless rabbit hole';

CREATE INDEX idx_watch_history_user ON watch_history(user_id, watched_at DESC);

-- Auto-delete 11th+ watch history entry
CREATE OR REPLACE FUNCTION maintain_watch_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete entries beyond 10 for this user
    DELETE FROM watch_history
    WHERE id IN (
        SELECT id
        FROM watch_history
        WHERE user_id = NEW.user_id
        ORDER BY watched_at DESC
        OFFSET 10
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_clean_watch_history
    AFTER INSERT ON watch_history
    FOR EACH ROW
    EXECUTE FUNCTION maintain_watch_history();

-- =====================================================
-- 7. ACTIVITY LOG (RECENT ACTIVITY AUDIT)
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    target_id UUID,
    target_type TEXT,
    target_username TEXT,
    target_title TEXT,
    duration_minutes INTEGER,
    is_expired BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_activity_type CHECK (
        activity_type IN ('viewed_profile', 'viewed_gig', 'viewed_post', 'viewed_sound_page', 'watched_video')
    )
);

COMMENT ON TABLE activity_log IS 'Recent Activity audit trail with expiration tracking';
COMMENT ON COLUMN activity_log.is_expired IS 'True if target content no longer exists';

CREATE INDEX idx_activity_log_user ON activity_log(user_id, created_at DESC);

-- Function to mark activities as expired when content deleted
CREATE OR REPLACE FUNCTION mark_activity_expired()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark activity log entries as expired
    UPDATE activity_log
    SET is_expired = true
    WHERE target_id = OLD.id
    AND target_type = TG_ARGV[0];
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers for content deletion
CREATE TRIGGER messages_mark_activity_expired
    BEFORE DELETE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION mark_activity_expired('message');

CREATE TRIGGER sound_snippets_mark_activity_expired
    BEFORE DELETE ON sound_snippets
    FOR EACH ROW
    EXECUTE FUNCTION mark_activity_expired('sound');

-- =====================================================
-- 8. ADMIN TICKETS (MODERATION SYSTEM)
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    opened_by_admin UUID REFERENCES profiles(id),
    reason TEXT,
    status TEXT DEFAULT 'pending',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    CONSTRAINT valid_ticket_status CHECK (
        status IN ('pending', 'user_editing', 'resolved', 'escalated')
    ),
    CONSTRAINT valid_target_type CHECK (
        target_type IN ('post', 'profile', 'sound', 'comment')
    )
);

COMMENT ON TABLE admin_tickets IS 'Ticket system for moderation - request changes instead of instant ban';
COMMENT ON COLUMN admin_tickets.status IS 'pending: awaiting user, user_editing: in progress, resolved: cleared, escalated: needs action';

CREATE INDEX idx_admin_tickets_status ON admin_tickets(status);
CREATE INDEX idx_admin_tickets_target_user ON admin_tickets(target_user_id);

-- Function to open admin ticket
CREATE OR REPLACE FUNCTION admin_open_ticket(
    p_target_type TEXT,
    p_target_id UUID,
    p_target_user_id UUID,
    p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_ticket_id UUID;
BEGIN
    -- Check admin permission
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin role required';
    END IF;
    
    -- Create ticket
    INSERT INTO admin_tickets (
        target_type,
        target_id,
        target_user_id,
        opened_by_admin,
        reason,
        status
    ) VALUES (
        p_target_type,
        p_target_id,
        p_target_user_id,
        v_admin_id,
        p_reason,
        'pending'
    ) RETURNING id INTO v_ticket_id;
    
    -- TODO: Send notification to user
    
    RETURN v_ticket_id;
END;
$$;

-- =====================================================
-- 9. HASHTAGS (VOLATILE SEARCH)
-- =====================================================

CREATE TABLE IF NOT EXISTS hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT UNIQUE NOT NULL,
    post_count INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT lowercase_tag CHECK (tag = LOWER(tag)),
    CONSTRAINT no_spaces_tag CHECK (tag !~ '\s')
);

COMMENT ON TABLE hashtags IS 'Volatile hashtags - disappear when no active posts use them';

CREATE INDEX idx_hashtags_tag ON hashtags(tag);
CREATE INDEX idx_hashtags_frequency ON hashtags(post_count DESC);

CREATE TABLE IF NOT EXISTS post_hashtags (
    post_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (post_id, hashtag_id)
);

CREATE INDEX idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);

-- Auto-delete hashtag when no posts use it
CREATE OR REPLACE FUNCTION cleanup_unused_hashtags()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete hashtags with 0 posts
    DELETE FROM hashtags
    WHERE id IN (
        SELECT h.id
        FROM hashtags h
        LEFT JOIN post_hashtags ph ON h.id = ph.hashtag_id
        WHERE ph.hashtag_id IS NULL
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_cleanup_hashtags
    AFTER DELETE ON post_hashtags
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_unused_hashtags();

-- =====================================================
-- 10. RLS POLICIES
-- =====================================================

ALTER TABLE sound_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE elite_6_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchor_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;

-- Sound Snippets (public read, artist edit)
CREATE POLICY "Anyone can view sound snippets"
ON sound_snippets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Artists can manage their sounds"
ON sound_snippets FOR ALL
TO authenticated
USING (artist_id = auth.uid());

-- Elite 6 (public read, creator/artist edit)
CREATE POLICY "Anyone can view Elite 6 videos"
ON elite_6_videos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Creators can manage their Elite 6 entries"
ON elite_6_videos FOR ALL
TO authenticated
USING (creator_id = auth.uid());

-- Favorites (user read/write own)
CREATE POLICY "Users can view their favorites"
ON user_favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their favorites"
ON user_favorites FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Anchor Posts (public read, owner edit)
CREATE POLICY "Anyone can view anchor posts"
ON anchor_posts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their anchor post"
ON anchor_posts FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Watch History (user read own)
CREATE POLICY "Users can view their watch history"
ON watch_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can add to their watch history"
ON watch_history FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Activity Log (user read own)
CREATE POLICY "Users can view their activity log"
ON activity_log FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin Tickets (user sees own, admin sees all)
CREATE POLICY "Users can view their tickets"
ON admin_tickets FOR SELECT
TO authenticated
USING (
    target_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Only admins can manage tickets"
ON admin_tickets FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Hashtags (public read)
CREATE POLICY "Anyone can view hashtags"
ON hashtags FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can view post hashtags"
ON post_hashtags FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- 11. ADMIN FUNCTIONS
-- =====================================================

-- Toggle artist status
CREATE OR REPLACE FUNCTION admin_toggle_artist(
    p_user_id UUID,
    p_is_artist BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
BEGIN
    -- Check admin permission
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin role required';
    END IF;
    
    -- Update artist status
    UPDATE profiles
    SET is_artist = p_is_artist
    WHERE id = p_user_id;
    
    -- Log action
    INSERT INTO admin_actions (
        admin_user_id,
        target_user_id,
        action_type,
        metadata
    ) VALUES (
        v_admin_id,
        p_user_id,
        'toggle_artist',
        jsonb_build_object('is_artist', p_is_artist)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'is_artist', p_is_artist
    );
END;
$$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Artist Page System installed successfully';
    RAISE NOTICE '📊 Tables created: sound_snippets, elite_6_videos, user_favorites, anchor_posts, watch_history, activity_log, admin_tickets, hashtags';
    RAISE NOTICE '🔒 RLS policies applied';
    RAISE NOTICE '⚡ Functions created: add_to_elite_6, replace_elite_6_video, admin_open_ticket, admin_toggle_artist';
    RAISE NOTICE '🎨 Artist constraints: 3 sounds, Elite 6 gallery, 5 favorites, 1 anchor post';
END $$;
