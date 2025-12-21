-- ==========================================
-- 6713 - SOVEREIGN DATABASE SCHEMA
-- Complete Clean Schema for Supabase
-- ==========================================

-- Drop all existing tables (clean slate)
DROP TABLE IF EXISTS admin_post_overrides CASCADE;
DROP TABLE IF EXISTS fourth_wall_breaks CASCADE;
DROP TABLE IF EXISTS cpr_log CASCADE;
DROP TABLE IF EXISTS post_cooldowns CASCADE;
DROP TABLE IF EXISTS wall_reactions CASCADE;
DROP TABLE IF EXISTS dm_messages CASCADE;
DROP TABLE IF EXISTS dm_threads CASCADE;
DROP TABLE IF EXISTS cpr_rescues CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS wall_messages CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions and triggers
DROP TRIGGER IF EXISTS trigger_assign_first_admin ON users;
DROP TRIGGER IF EXISTS trigger_regenerate_coma_refills ON profiles;
DROP TRIGGER IF EXISTS set_first_user_admin_trigger ON profiles;
DROP FUNCTION IF EXISTS assign_first_admin();
DROP FUNCTION IF EXISTS regenerate_coma_refills();
DROP FUNCTION IF EXISTS set_first_user_as_admin();

-- ==========================================
-- CORE TABLES
-- ==========================================

-- Users table (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (user metadata, COMA, talents, shrine)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  wiki TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE, -- NULL = not verified, NOT NULL = verified
  
  -- COMA System
  coma_status BOOLEAN DEFAULT TRUE,
  coma_reason TEXT CHECK (coma_reason IN ('Choice', 'Quest', NULL)),
  coma_entered_at TIMESTAMP WITH TIME ZONE,
  coma_exited_at TIMESTAMP WITH TIME ZONE,
  coma_refills INTEGER DEFAULT 3,
  coma_refills_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Talent Economy
  talent_balance INTEGER DEFAULT 100,
  
  -- Self-Kill & Shrine (72-hour void)
  deactivated_at TIMESTAMP WITH TIME ZONE,
  shrine_link TEXT,
  shrine_media TEXT,
  last_shrine_edit TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings (Glaze Protocol, etc.)
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Glaze Protocol setting
INSERT INTO system_settings (setting_key, setting_value) 
VALUES ('glaze_active', false);

-- ==========================================
-- WALL (PUBLIC SQUARE)
-- ==========================================

-- Wall messages/posts
CREATE TABLE wall_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'picture', 'system')),
  is_pope_ai BOOLEAN DEFAULT FALSE,
  is_coma_whisper BOOLEAN DEFAULT FALSE,
  admin_rigged_stats BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments (67+ cap per post)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reactions/Likes (13+ cap display)
CREATE TABLE wall_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Post cooldowns (7-second slow mode)
CREATE TABLE post_cooldowns (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_post_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin post overrides (13+ rigging)
CREATE TABLE admin_post_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE UNIQUE,
  override_like_count TEXT DEFAULT '13+',
  overridden_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CPR SYSTEM (RESURRECTION)
-- ==========================================

-- CPR rescues (who gave CPR to whom)
CREATE TABLE cpr_rescues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghost_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rescuer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ghost_user_id, rescuer_user_id)
);

-- CPR log (batch tracking for shrine link reveals)
CREATE TABLE cpr_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghost_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rescuer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_number INTEGER NOT NULL,
  shrine_link_viewed BOOLEAN DEFAULT FALSE,
  shrine_link_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ghost_user_id, rescuer_user_id, batch_number)
);

-- ==========================================
-- DM SYSTEM (POPE AI & WHISPERS)
-- ==========================================

-- DM threads
CREATE TABLE dm_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pope_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DM messages
CREATE TABLE dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES dm_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_username TEXT NOT NULL,
  content TEXT NOT NULL,
  is_whisper BOOLEAN DEFAULT FALSE,
  fourth_wall_broken BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fourth wall breaks (COMA whisper responses)
CREATE TABLE fourth_wall_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coma_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_wall_messages_created_at ON wall_messages(created_at DESC);
CREATE INDEX idx_wall_messages_user_id ON wall_messages(user_id);
CREATE INDEX idx_wall_reactions_message_id ON wall_reactions(message_id);
CREATE INDEX idx_wall_reactions_user_id ON wall_reactions(user_id);
CREATE INDEX idx_post_cooldowns_user_id ON post_cooldowns(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_cpr_rescues_ghost ON cpr_rescues(ghost_user_id);
CREATE INDEX idx_cpr_rescues_rescuer ON cpr_rescues(rescuer_user_id);
CREATE INDEX idx_cpr_log_ghost ON cpr_log(ghost_user_id);
CREATE INDEX idx_cpr_log_rescuer ON cpr_log(rescuer_user_id);
CREATE INDEX idx_cpr_log_batch ON cpr_log(ghost_user_id, batch_number);
CREATE INDEX idx_dm_threads_user ON dm_threads(user_id);
CREATE INDEX idx_dm_messages_thread ON dm_messages(thread_id);
CREATE INDEX idx_fourth_wall_breaks_coma ON fourth_wall_breaks(coma_user_id);
CREATE INDEX idx_fourth_wall_breaks_status ON fourth_wall_breaks(status);
CREATE INDEX idx_profiles_verified ON profiles(verified_at);
CREATE INDEX idx_profiles_deactivated ON profiles(deactivated_at);

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function: Auto-assign first user as admin
CREATE OR REPLACE FUNCTION set_first_user_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first profile (Pope Trigger)
  IF (SELECT COUNT(*) FROM profiles) = 0 THEN
    NEW.is_admin := true;
    NEW.verified_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Assign first user as admin
CREATE TRIGGER set_first_user_admin_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_first_user_as_admin();

-- Function: Regenerate COMA refills (1 per 24 hours, max 3)
CREATE OR REPLACE FUNCTION regenerate_coma_refills()
RETURNS TRIGGER AS $$
DECLARE
  hours_passed INTEGER;
BEGIN
  hours_passed := EXTRACT(EPOCH FROM (NOW() - NEW.coma_refills_last_updated)) / 3600;
  
  IF hours_passed >= 24 AND NEW.coma_refills < 3 THEN
    NEW.coma_refills := LEAST(3, NEW.coma_refills + (hours_passed / 24)::INTEGER);
    NEW.coma_refills_last_updated := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-regenerate refills on profile update
CREATE TRIGGER trigger_regenerate_coma_refills
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION regenerate_coma_refills();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wall_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wall_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

-- Users: Read all, update own
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Profiles: Read all, update own
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Wall: Read all, create own, update/delete own
CREATE POLICY "Users can view all wall messages"
  ON wall_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create wall messages"
  ON wall_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON wall_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments: Read all, create own
CREATE POLICY "Users can view all comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Reactions: Read all, create/delete own
CREATE POLICY "Users can view all reactions"
  ON wall_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reactions"
  ON wall_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
  ON wall_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- DM Threads: Read own
CREATE POLICY "Users can view own DM threads"
  ON dm_threads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own DM threads"
  ON dm_threads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DM Messages: Read own threads
CREATE POLICY "Users can view messages in own threads"
  ON dm_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dm_threads
      WHERE dm_threads.id = dm_messages.thread_id
      AND dm_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own threads"
  ON dm_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dm_threads
      WHERE dm_threads.id = dm_messages.thread_id
      AND dm_threads.user_id = auth.uid()
    )
  );

-- ==========================================
-- COMPLETE
-- ==========================================

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
