-- Gig Protocol Tables
-- Users can post up to 5 active Gigs at a time for 10 Talents each

-- Gigs Table
CREATE TABLE IF NOT EXISTS gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  talent_reward INTEGER NOT NULL CHECK (talent_reward > 0),
  budge_enabled BOOLEAN DEFAULT FALSE, -- Real-time "Hey, bored? Help me" toggle
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_expires_at TIMESTAMP WITH TIME ZONE, -- 3-day window after completion
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if table already existed with old schema
DO $$
BEGIN
  -- Add is_completed if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gigs' AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE gigs ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add completed_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gigs' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE gigs ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add budge_enabled if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gigs' AND column_name = 'budge_enabled'
  ) THEN
    ALTER TABLE gigs ADD COLUMN budge_enabled BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add talent_reward if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gigs' AND column_name = 'talent_reward'
  ) THEN
    ALTER TABLE gigs ADD COLUMN talent_reward INTEGER NOT NULL DEFAULT 50 CHECK (talent_reward > 0);
  END IF;
  
  -- Add completed_expires_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gigs' AND column_name = 'completed_expires_at'
  ) THEN
    ALTER TABLE gigs ADD COLUMN completed_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gigs_user ON gigs(user_id);
CREATE INDEX IF NOT EXISTS idx_gigs_active ON gigs(is_completed) WHERE is_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_gigs_created ON gigs(created_at DESC);

-- RLS Policies
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active gigs" ON gigs;
CREATE POLICY "Anyone can read active gigs"
ON gigs FOR SELECT
USING (is_completed = FALSE);

DROP POLICY IF EXISTS "Users can read their own completed gigs" ON gigs;
CREATE POLICY "Users can read their own completed gigs"
ON gigs FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create gigs" ON gigs;
CREATE POLICY "Users can create gigs"
ON gigs FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own gigs" ON gigs;
CREATE POLICY "Users can update their own gigs"
ON gigs FOR UPDATE
USING (auth.uid() = user_id);

-- Function: Check if user has less than 5 active gigs
CREATE OR REPLACE FUNCTION user_can_post_gig(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM gigs
  WHERE user_id = user_uuid AND is_completed = FALSE;
  
  RETURN active_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's active gig count
CREATE OR REPLACE FUNCTION get_active_gig_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM gigs
  WHERE user_id = user_uuid AND is_completed = FALSE;
  
  RETURN active_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Set 3-day expiry when Gig is completed
CREATE OR REPLACE FUNCTION set_gig_completion_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- When Gig is marked as completed, set 3-day expiry window
  IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
    NEW.completed_at := NOW();
    NEW.completed_expires_at := NOW() + INTERVAL '3 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_gig_completion_expiry ON gigs;
CREATE TRIGGER trigger_set_gig_completion_expiry
  BEFORE UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION set_gig_completion_expiry();

-- Function: Cleanup completed Gigs after 3-day window
CREATE OR REPLACE FUNCTION cleanup_completed_gigs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM gigs
    WHERE is_completed = TRUE
      AND completed_expires_at IS NOT NULL
      AND completed_expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Delete incomplete Gig with no-refund policy (transfers 10 Talents to admin)
CREATE OR REPLACE FUNCTION delete_gig_no_refund(
  gig_id UUID,
  deleting_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  gig_record RECORD;
  admin_user_id UUID;
BEGIN
  -- Get the Gig
  SELECT * INTO gig_record FROM gigs WHERE id = gig_id AND user_id = deleting_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gig not found or unauthorized');
  END IF;
  
  -- Prevent deletion if Gig is completed (must wait 3 days)
  IF gig_record.is_completed = TRUE THEN
    IF gig_record.completed_expires_at > NOW() THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Completed Gigs cannot be deleted manually. They auto-delete after 3 days as proof of experience.'
      );
    END IF;
  END IF;
  
  -- Get admin user (first user with role = 'admin')
  SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- If incomplete, transfer 10 Talents to admin (no refund)
  IF gig_record.is_completed = FALSE AND admin_user_id IS NOT NULL THEN
    UPDATE profiles
    SET talent_balance = talent_balance + 10
    WHERE user_id = admin_user_id;
  END IF;
  
  -- Delete the Gig
  DELETE FROM gigs WHERE id = gig_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'refunded', false,
    'message', CASE 
      WHEN gig_record.is_completed = FALSE 
      THEN 'Gig deleted. 10 Talents transferred to company (no refund policy).'
      ELSE 'Completed Gig deleted after 3-day experience window.'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Realtime for gig updates
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE gigs;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication
END $$;
