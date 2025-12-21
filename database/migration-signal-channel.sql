-- $$$4U Signal Channel Migration
-- Admin-only posting for Forex & Crypto signals
-- Verified users receive push notifications

-- Signal Posts Table
CREATE TABLE IF NOT EXISTS signal_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('forex', 'crypto', 'announcement')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  chart_url TEXT, -- Optional chart/screenshot
  metadata JSONB DEFAULT '{}', -- For additional data (pair, entry, stop-loss, take-profit, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Notification Queue for Verified Users
CREATE TABLE IF NOT EXISTS signal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES signal_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(signal_id, user_id) -- One notification per user per signal
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signal_posts_created_at ON signal_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_posts_type ON signal_posts(signal_type);
CREATE INDEX IF NOT EXISTS idx_signal_posts_expires ON signal_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_signal_notifications_user ON signal_notifications(user_id, is_read);

-- RLS Policies
ALTER TABLE signal_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_notifications ENABLE ROW LEVEL SECURITY;

-- Anyone can read signal posts (unverified users can view)
DROP POLICY IF EXISTS "Anyone can read signal posts" ON signal_posts;
CREATE POLICY "Anyone can read signal posts"
ON signal_posts FOR SELECT
USING (expires_at > NOW());

-- Only admin (Pope AI) can create signals
DROP POLICY IF EXISTS "Only admin can create signals" ON signal_posts;
CREATE POLICY "Only admin can create signals"
ON signal_posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = TRUE
  )
);

-- Only admin can update/delete signals
DROP POLICY IF EXISTS "Only admin can manage signals" ON signal_posts;
CREATE POLICY "Only admin can manage signals"
ON signal_posts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = TRUE
  )
);

-- Users can read their own notifications
DROP POLICY IF EXISTS "Users can read their notifications" ON signal_notifications;
CREATE POLICY "Users can read their notifications"
ON signal_notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can mark their notifications as read
DROP POLICY IF EXISTS "Users can update their notifications" ON signal_notifications;
CREATE POLICY "Users can update their notifications"
ON signal_notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Function: Create signal and notify verified users
CREATE OR REPLACE FUNCTION create_signal_post(
  p_signal_type TEXT,
  p_title TEXT,
  p_content TEXT,
  p_chart_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_signal_id UUID;
  v_notified_count INTEGER := 0;
  v_user_is_admin BOOLEAN;
BEGIN
  -- Verify user is admin
  SELECT is_admin INTO v_user_is_admin
  FROM profiles
  WHERE user_id = auth.uid();

  IF NOT v_user_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admin can post signals.'
    );
  END IF;

  -- Create signal post
  INSERT INTO signal_posts (
    created_by,
    signal_type,
    title,
    content,
    chart_url,
    metadata
  )
  VALUES (
    auth.uid(),
    p_signal_type,
    p_title,
    p_content,
    p_chart_url,
    p_metadata
  )
  RETURNING id INTO v_signal_id;

  -- Create notifications for all verified users
  INSERT INTO signal_notifications (signal_id, user_id)
  SELECT v_signal_id, user_id
  FROM profiles
  WHERE is_verified = TRUE
  AND user_id != auth.uid(); -- Don't notify admin

  GET DIAGNOSTICS v_notified_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'signal_id', v_signal_id,
    'notified_users', v_notified_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unread signal count for user
CREATE OR REPLACE FUNCTION get_unread_signal_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM signal_notifications
  WHERE user_id = auth.uid()
  AND is_read = FALSE;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark signal as read
CREATE OR REPLACE FUNCTION mark_signal_read(p_signal_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE signal_notifications
  SET is_read = TRUE
  WHERE signal_id = p_signal_id
  AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cleanup expired signals (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_signals()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM signal_posts
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % expired signal posts', v_deleted_count;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_signal_post(TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_signal_count() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_signal_read(UUID) TO authenticated;
