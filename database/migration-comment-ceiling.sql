-- =====================================================
-- 6713 PROTOCOL: 67-COMMENT CEILING WITH FIFO AUTO-DELETE
-- =====================================================
-- "First-In, First-Out" - When comment #68 arrives, #1 is deleted
-- The counter displays stop at "67" to maintain protocol mystique
-- =====================================================

-- Add comment_count column to posts (for Hue posts, Stories)
ALTER TABLE IF EXISTS posts 
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Add reply_count column to wall_messages (for Wall threads)
ALTER TABLE IF EXISTS wall_messages 
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Add reply_count to live_streams (for Live stream comments)
ALTER TABLE IF EXISTS live_streams 
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- =====================================================
-- FUNCTION: Get Comment Count (Capped at 67 for Display)
-- =====================================================
CREATE OR REPLACE FUNCTION get_comment_count_display(
  p_parent_id UUID,
  p_parent_type TEXT -- 'post', 'wall', 'live'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actual_count INTEGER;
BEGIN
  -- Get actual count based on parent type
  IF p_parent_type = 'post' THEN
    SELECT comment_count INTO v_actual_count
    FROM posts
    WHERE id = p_parent_id;
  ELSIF p_parent_type = 'wall' THEN
    SELECT reply_count INTO v_actual_count
    FROM wall_messages
    WHERE id = p_parent_id;
  ELSIF p_parent_type = 'live' THEN
    SELECT comment_count INTO v_actual_count
    FROM live_streams
    WHERE id = p_parent_id;
  ELSE
    RETURN 0;
  END IF;

  -- Cap display at 67
  IF v_actual_count > 67 THEN
    RETURN 67;
  ELSE
    RETURN COALESCE(v_actual_count, 0);
  END IF;
END;
$$;

-- =====================================================
-- FUNCTION: Enforce 67-Comment Ceiling (Auto-Delete Oldest)
-- =====================================================
CREATE OR REPLACE FUNCTION enforce_comment_ceiling()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comment_count INTEGER;
  v_oldest_comment_id UUID;
  v_parent_id UUID;
  v_parent_type TEXT;
BEGIN
  -- Determine parent context
  IF TG_TABLE_NAME = 'comments' THEN
    v_parent_id := NEW.post_id;
    v_parent_type := 'post';
  ELSIF TG_TABLE_NAME = 'wall_replies' THEN
    v_parent_id := NEW.parent_message_id;
    v_parent_type := 'wall';
  ELSIF TG_TABLE_NAME = 'live_comments' THEN
    v_parent_id := NEW.stream_id;
    v_parent_type := 'live';
  ELSE
    RETURN NEW;
  END IF;

  -- Count current comments for this parent
  IF v_parent_type = 'post' THEN
    SELECT COUNT(*) INTO v_comment_count
    FROM comments
    WHERE post_id = v_parent_id;
  ELSIF v_parent_type = 'wall' THEN
    SELECT COUNT(*) INTO v_comment_count
    FROM wall_replies
    WHERE parent_message_id = v_parent_id;
  ELSIF v_parent_type = 'live' THEN
    SELECT COUNT(*) INTO v_comment_count
    FROM live_comments
    WHERE stream_id = v_parent_id;
  END IF;

  -- If we've hit 68 comments, delete the oldest
  IF v_comment_count > 67 THEN
    IF v_parent_type = 'post' THEN
      -- Get oldest comment ID
      SELECT id INTO v_oldest_comment_id
      FROM comments
      WHERE post_id = v_parent_id
      ORDER BY created_at ASC
      LIMIT 1;
      
      -- Delete it
      DELETE FROM comments WHERE id = v_oldest_comment_id;
      
    ELSIF v_parent_type = 'wall' THEN
      -- Get oldest reply ID
      SELECT id INTO v_oldest_comment_id
      FROM wall_replies
      WHERE parent_message_id = v_parent_id
      ORDER BY created_at ASC
      LIMIT 1;
      
      -- Delete it
      DELETE FROM wall_replies WHERE id = v_oldest_comment_id;
      
    ELSIF v_parent_type = 'live' THEN
      -- Get oldest comment ID
      SELECT id INTO v_oldest_comment_id
      FROM live_comments
      WHERE stream_id = v_parent_id
      ORDER BY created_at ASC
      LIMIT 1;
      
      -- Delete it
      DELETE FROM live_comments WHERE id = v_oldest_comment_id;
    END IF;
  END IF;

  -- Update parent's comment count (cap at 67)
  IF v_parent_type = 'post' THEN
    UPDATE posts 
    SET comment_count = LEAST(v_comment_count, 67)
    WHERE id = v_parent_id;
  ELSIF v_parent_type = 'wall' THEN
    UPDATE wall_messages 
    SET reply_count = LEAST(v_comment_count, 67)
    WHERE id = v_parent_id;
  ELSIF v_parent_type = 'live' THEN
    UPDATE live_streams 
    SET comment_count = LEAST(v_comment_count, 67)
    WHERE id = v_parent_id;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS: Apply Ceiling to All Comment Tables
-- =====================================================

-- Hue/Search Post Comments
DROP TRIGGER IF EXISTS trigger_comment_ceiling_posts ON comments;
CREATE TRIGGER trigger_comment_ceiling_posts
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION enforce_comment_ceiling();

-- Wall Message Replies
DROP TRIGGER IF EXISTS trigger_comment_ceiling_wall ON wall_replies;
CREATE TRIGGER trigger_comment_ceiling_wall
AFTER INSERT ON wall_replies
FOR EACH ROW
EXECUTE FUNCTION enforce_comment_ceiling();

-- Live Stream Comments
DROP TRIGGER IF EXISTS trigger_comment_ceiling_live ON live_comments;
CREATE TRIGGER trigger_comment_ceiling_live
AFTER INSERT ON live_comments
FOR EACH ROW
EXECUTE FUNCTION enforce_comment_ceiling();

-- =====================================================
-- FUNCTION: Initialize Comment Counts (Backfill)
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_comment_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update posts comment_count
  UPDATE posts p
  SET comment_count = (
    SELECT COUNT(*)
    FROM comments c
    WHERE c.post_id = p.id
  );

  -- Update wall_messages reply_count
  UPDATE wall_messages wm
  SET reply_count = (
    SELECT COUNT(*)
    FROM wall_replies wr
    WHERE wr.parent_message_id = wm.id
  );

  -- Update live_streams comment_count
  UPDATE live_streams ls
  SET comment_count = (
    SELECT COUNT(*)
    FROM live_comments lc
    WHERE lc.stream_id = ls.id
  );
END;
$$;

-- Run backfill (comment out after first run)
-- SELECT initialize_comment_counts();

-- =====================================================
-- RLS POLICIES: No Changes (Existing Policies Apply)
-- =====================================================
-- Comments are still governed by existing RLS policies
-- The ceiling logic runs at the database level via triggers

-- =====================================================
-- PROTOCOL NOTICE
-- =====================================================
-- Comment Ceiling: 67 maximum per post/message
-- Auto-Delete: When #68 arrives, #1 is permanently deleted
-- Display Cap: UI shows "67" when count >= 67
-- FIFO Rule: "First-In, First-Out" - attention is currency
-- =====================================================
