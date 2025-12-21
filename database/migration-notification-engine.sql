-- 6713 Protocol - Notification Engine
-- Granular frequency controls for all protocol events

-- Add notification_preferences to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{
      "signals": {
        "enabled": true,
        "verified_only": true
      },
      "gigs": {
        "join_request": true,
        "gig_accepted": true,
        "pope_gig_close": true
      },
      "wall": {
        "mentions": true,
        "talent_throw": true
      },
      "live_hue": {
        "live_pulse": true,
        "new_story": true
      },
      "account": {
        "self_kill": true,
        "verification_status": true
      },
      "quiet_hours": {
        "enabled": false,
        "start_time": "00:00",
        "end_time": "06:00"
      }
    }'::JSONB;
    RAISE NOTICE 'Added notification_preferences column to profiles table';
  ELSE
    RAISE NOTICE 'notification_preferences column already exists in profiles table';
  END IF;
END $$;

-- Notification Queue Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  deep_link TEXT, -- Deep link URL for navigation
  is_read BOOLEAN DEFAULT FALSE,
  is_delivered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_undelivered ON notifications(is_delivered, created_at) WHERE is_delivered = FALSE;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
DROP POLICY IF EXISTS "Users can read their notifications" ON notifications;
CREATE POLICY "Users can read their notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Function: Check if user has notification enabled
CREATE OR REPLACE FUNCTION is_notification_enabled(
  p_user_id UUID,
  p_notification_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_prefs JSONB;
  v_quiet_hours JSONB;
  v_is_verified BOOLEAN;
  v_current_time TIME;
  v_start_time TIME;
  v_end_time TIME;
BEGIN
  -- Get user preferences
  SELECT notification_preferences, is_verified
  INTO v_prefs, v_is_verified
  FROM profiles
  WHERE user_id = p_user_id;

  IF v_prefs IS NULL THEN
    RETURN TRUE; -- Default to enabled if no preferences set
  END IF;

  -- Check quiet hours
  v_quiet_hours := v_prefs->'quiet_hours';
  IF v_quiet_hours->>'enabled' = 'true' THEN
    v_current_time := CURRENT_TIME;
    v_start_time := (v_quiet_hours->>'start_time')::TIME;
    v_end_time := (v_quiet_hours->>'end_time')::TIME;
    
    -- Check if current time is in quiet hours
    IF v_start_time < v_end_time THEN
      IF v_current_time >= v_start_time AND v_current_time < v_end_time THEN
        RETURN FALSE;
      END IF;
    ELSE
      -- Quiet hours spans midnight
      IF v_current_time >= v_start_time OR v_current_time < v_end_time THEN
        RETURN FALSE;
      END IF;
    END IF;
  END IF;

  -- Check specific notification type
  CASE p_notification_type
    WHEN 'signal' THEN
      -- Signals are verified-only
      IF NOT v_is_verified THEN
        RETURN FALSE;
      END IF;
      RETURN (v_prefs->'signals'->>'enabled')::BOOLEAN;
    
    WHEN 'gig_join_request' THEN
      RETURN (v_prefs->'gigs'->>'join_request')::BOOLEAN;
    
    WHEN 'gig_accepted' THEN
      RETURN (v_prefs->'gigs'->>'gig_accepted')::BOOLEAN;
    
    WHEN 'pope_gig_close' THEN
      RETURN (v_prefs->'gigs'->>'pope_gig_close')::BOOLEAN;
    
    WHEN 'wall_mention' THEN
      RETURN (v_prefs->'wall'->>'mentions')::BOOLEAN;
    
    WHEN 'talent_throw' THEN
      RETURN (v_prefs->'wall'->>'talent_throw')::BOOLEAN;
    
    WHEN 'live_pulse' THEN
      RETURN (v_prefs->'live_hue'->>'live_pulse')::BOOLEAN;
    
    WHEN 'new_story' THEN
      RETURN (v_prefs->'live_hue'->>'new_story')::BOOLEAN;
    
    WHEN 'self_kill' THEN
      RETURN (v_prefs->'account'->>'self_kill')::BOOLEAN;
    
    WHEN 'verification_status' THEN
      RETURN (v_prefs->'account'->>'verification_status')::BOOLEAN;
    
    ELSE
      RETURN TRUE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}',
  p_deep_link TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_enabled BOOLEAN;
BEGIN
  -- Check if notification is enabled for user
  v_enabled := is_notification_enabled(p_user_id, p_notification_type);
  
  IF NOT v_enabled THEN
    RETURN NULL; -- Don't create notification if disabled
  END IF;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    notification_type,
    title,
    body,
    data,
    deep_link
  )
  VALUES (
    p_user_id,
    p_notification_type,
    p_title,
    p_body,
    p_data,
    p_deep_link
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM notifications
  WHERE user_id = auth.uid()
  AND is_read = FALSE;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get badge counts by type
CREATE OR REPLACE FUNCTION get_badge_counts()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'signals', COUNT(*) FILTER (WHERE notification_type = 'signal'),
    'gigs', COUNT(*) FILTER (WHERE notification_type LIKE 'gig_%'),
    'wall', COUNT(*) FILTER (WHERE notification_type LIKE 'wall_%'),
    'live_hue', COUNT(*) FILTER (WHERE notification_type IN ('live_pulse', 'new_story')),
    'account', COUNT(*) FILTER (WHERE notification_type IN ('self_kill', 'verification_status'))
  )
  INTO v_result
  FROM notifications
  WHERE user_id = auth.uid()
  AND is_read = FALSE;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE,
      read_at = NOW()
  WHERE id = p_notification_id
  AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = TRUE,
      read_at = NOW()
  WHERE user_id = auth.uid()
  AND is_read = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Notify on new signal post (verified users only)
CREATE OR REPLACE FUNCTION notify_signal_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all verified users
  INSERT INTO notifications (user_id, notification_type, title, body, data, deep_link)
  SELECT 
    user_id,
    'signal',
    '🚨 Wealth Alert: New ' || NEW.signal_type || ' Signal',
    NEW.title,
    jsonb_build_object('signal_id', NEW.id, 'signal_type', NEW.signal_type),
    '/money?tab=signals&signal=' || NEW.id
  FROM profiles
  WHERE is_verified = TRUE
  AND user_id != NEW.created_by
  AND is_notification_enabled(user_id, 'signal') = TRUE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_signal_post ON signal_posts;
CREATE TRIGGER trigger_notify_signal_post
AFTER INSERT ON signal_posts
FOR EACH ROW
EXECUTE FUNCTION notify_signal_post();

-- Trigger: Notify on Talent throw
CREATE OR REPLACE FUNCTION notify_talent_throw()
RETURNS TRIGGER AS $$
DECLARE
  v_thrower_username TEXT;
BEGIN
  -- Get thrower username
  SELECT username INTO v_thrower_username
  FROM profiles
  WHERE user_id = NEW.from_user_id;

  -- Notify recipient
  PERFORM create_notification(
    NEW.to_user_id,
    'talent_throw',
    '💰 Talent Incoming!',
    v_thrower_username || ' threw ' || NEW.amount || 'T at your message!',
    jsonb_build_object('amount', NEW.amount, 'from_user_id', NEW.from_user_id),
    '/wall?message=' || NEW.message_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_talent_throw ON talent_transactions;
CREATE TRIGGER trigger_notify_talent_throw
AFTER INSERT ON talent_transactions
FOR EACH ROW
WHEN (NEW.transaction_type = 'throw')
EXECUTE FUNCTION notify_talent_throw();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_notification_enabled(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_badge_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read() TO authenticated;
