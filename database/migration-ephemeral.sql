-- Genesis Cleanup: Ephemeral Architecture Migration
-- Auto-expiration for cost control and FOMO engagement

-- 1. Add is_permanent flag for content that should never expire
ALTER TABLE wall_messages 
ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT FALSE;

-- 2. Update expires_at logic with trigger
CREATE OR REPLACE FUNCTION set_message_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Permanent content (Pope AI, system messages, ID verifications)
  IF NEW.is_permanent = TRUE OR NEW.is_pope_ai = TRUE OR NEW.message_type = 'system' THEN
    NEW.expires_at := NULL; -- Never expires
    
  -- Stories: 24 hours
  ELSIF NEW.post_type = 'story' THEN
    NEW.expires_at := NEW.created_at + INTERVAL '24 hours';
    
  -- Wall posts: Always 3 days (Gig posts included - only Gig entity persists)
  ELSIF NEW.post_type = 'wall' THEN
    NEW.expires_at := NEW.created_at + INTERVAL '3 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to automatically set expiry on insert/update
DROP TRIGGER IF EXISTS trigger_set_message_expiry ON wall_messages;
CREATE TRIGGER trigger_set_message_expiry
  BEFORE INSERT OR UPDATE ON wall_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_expiry();

-- 3. Create function to track deleted media URLs
CREATE TABLE IF NOT EXISTS deleted_media_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- 4. Trigger to queue media for deletion when message is deleted
CREATE OR REPLACE FUNCTION queue_media_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- If the deleted message had media, queue it for cleanup
  IF OLD.media_url IS NOT NULL AND OLD.media_url != '' THEN
    INSERT INTO deleted_media_queue (media_url)
    VALUES (OLD.media_url);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_queue_media_deletion ON wall_messages;
CREATE TRIGGER trigger_queue_media_deletion
  AFTER DELETE ON wall_messages
  FOR EACH ROW
  EXECUTE FUNCTION queue_media_deletion();

-- 5. Function to delete expired messages (call this via cron or edge function)
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS TABLE(deleted_count INTEGER, media_urls_queued INTEGER) AS $$
DECLARE
  deleted_rows INTEGER;
  media_count INTEGER;
BEGIN
  -- Delete expired messages (but not permanent ones)
  WITH deleted AS (
    DELETE FROM wall_messages
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW()
      AND is_permanent = FALSE
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_rows FROM deleted;
  
  -- Count how many media files were queued for deletion
  SELECT COUNT(*) INTO media_count 
  FROM deleted_media_queue 
  WHERE processed = FALSE;
  
  RETURN QUERY SELECT deleted_rows, media_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to update post expiry when Gig budge status changes
CREATE OR REPLACE FUNCTION update_posts_on_gig_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When a Gig's budge_enabled or is_completed changes
  IF (OLD.budge_enabled != NEW.budge_enabled) OR (OLD.is_completed != NEW.is_completed) THEN
    
    -- If Budge was enabled and Gig is still active, remove expiry from user's wall posts
    IF NEW.budge_enabled = TRUE AND NEW.is_completed = FALSE THEN
      UPDATE wall_messages
      SET expires_at = NULL
      WHERE user_id = NEW.user_id
        AND post_type = 'wall'
        AND is_permanent = FALSE;
    
    --Create index for efficient cleanup queries
  AND g.is_completed = FALSE
  AND wm.is_permanent = FALSE;

-- 7. Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_wall_messages_expiry_cleanup 
ON wall_messages(expires_at) 
WHERE expires_at IS NOT NULL AND is_permanent = FALSE;

-- 8. Update existing wall posts to have 3-day expiry
UPDATE wall_messages 
SET expires_at = created_at + INTERVAL '3 days'
WHERE post_type = 'wall' 
  AND expires_at IS NULL 
  AND is_permanent = FALSE
  AND is_pope_ai = FALSE
  AND message_type != 'system';

-- 9. Verification output
DO $$ 
DECLARE
  total_messages INTEGER;
  expiring_messages INTEGER;
  permanent_messages INTEGER;
  expired_now INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_messages FROM wall_messages;
  SELECT COUNT(*) INTO expiring_messages FROM wall_messages WHERE expires_at IS NOT NULL;
  SELECT COUNT(*) INTO permanent_messages FROM wall_messages WHERE is_permanent = TRUE OR expires_at IS NULL;
  SELECT COUNT(*) INTO expired_now FROM wall_messages WHERE expires_at < NOW();
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '🗑️  GENESIS CLEANUP - EPHEMERAL ARCHITECTURE';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 MESSAGE STATISTICS:';
  RAISE NOTICE '  Total messages: %', total_messages;
  RAISE NOTICE '  Will expire: % (3-day wall posts + 24h stories)', expiring_messages;
  RAISE NOTICE '  Permanent: % (Pope AI, system messages)', permanent_messages;
  RAISE NOTICE '  Expired now: % (ready for cleanup)', expired_now;
  RAISE NOTICE '';
  RAISE NOTICE '⏰ EXPIRATION RULES:';
  RAISE NOTICE '  Stories: 24 hours';
  RAISE NOTICE '  Wall posts: 3 days (72 hours)';
  RAISE NOTICE '  Pope AI: Permanent';
  RAISE NOTICE '  System messages: Permanent';
  RAISE NOTICE '✅ EPHEMERAL ARCHITECTURE ACTIVE';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
