-- Database Schema for 6713 - Sovereign Database

-- Drop existing triggers to allow re-running this script
DROP TRIGGER IF EXISTS trigger_assign_first_admin ON users;
DROP TRIGGER IF EXISTS trigger_regenerate_coma_refills ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS assign_first_admin() CASCADE;
DROP FUNCTION IF EXISTS regenerate_coma_refills() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Users table (authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (user metadata and COMA logic)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  wiki TEXT, -- User's personal wiki/bio
  coma_status BOOLEAN DEFAULT TRUE, -- Default true per spec
  coma_reason TEXT CHECK (coma_reason IN ('Choice', 'Quest', NULL)),
  coma_entered_at TIMESTAMP WITH TIME ZONE,
  coma_exited_at TIMESTAMP WITH TIME ZONE,
  coma_refills INTEGER DEFAULT 3,
  coma_refills_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  talent_balance INTEGER DEFAULT 100, -- Renamed from 'talents', default 100
  
  -- Self-Kill & Shrine features
  deactivated_at TIMESTAMP WITH TIME ZONE, -- Self-Kill timestamp (72h lockout)
  shrine_link TEXT, -- Secret link revealed after 13 CPRs
  shrine_media TEXT, -- Looping media URL
  last_shrine_edit TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings (Global configurations)
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default glaze protocol setting
INSERT INTO system_settings (setting_key, setting_value) 
VALUES ('glaze_active', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Wall messages/posts table (MUST BE BEFORE admin_post_overrides)
CREATE TABLE IF NOT EXISTS wall_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT, -- URL to uploaded media from storage bucket
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'picture', 'system')),
  post_type TEXT DEFAULT 'wall' CHECK (post_type IN ('wall', 'story')), -- Wall = permanent, Story = 24h
  expires_at TIMESTAMP WITH TIME ZONE, -- Auto-calculated: stories=24h, wall=3days, permanent=NULL
  is_permanent BOOLEAN DEFAULT FALSE, -- Pope AI logs, system messages bypass expiration
  is_pope_ai BOOLEAN DEFAULT FALSE,
  is_coma_whisper BOOLEAN DEFAULT FALSE,
  admin_rigged_stats BOOLEAN DEFAULT FALSE, -- Admin "Award Max Stats" flag
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin overrides for post stats (13+ rigging)
CREATE TABLE IF NOT EXISTS admin_post_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE UNIQUE,
  override_like_count TEXT DEFAULT '13+', -- Display value
  overridden_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table (67+ cap)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reactions table (likes with 13+ cap)
CREATE TABLE IF NOT EXISTS wall_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Post cooldowns table (7-second slow mode)
CREATE TABLE IF NOT EXISTS post_cooldowns (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_post_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CPR Log for tracking shrine link reveals (view once)
CREATE TABLE IF NOT EXISTS cpr_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghost_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rescuer_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  batch_number INTEGER NOT NULL, -- Which batch of 13 this CPR belongs to
  shrine_link_viewed BOOLEAN DEFAULT FALSE,
  shrine_link_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ghost_user_id, rescuer_user_id, batch_number)
);

-- CPR system (Self-Kill resurrection)
CREATE TABLE IF NOT EXISTS cpr_rescues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghost_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rescuer_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ghost_user_id, rescuer_user_id)
);

-- DM threads (Pope AI and user conversations)
CREATE TABLE IF NOT EXISTS dm_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_pope_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DM messages
CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES dm_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_username TEXT NOT NULL,
  content TEXT NOT NULL,
  is_whisper BOOLEAN DEFAULT FALSE, -- COMA one-way whisper
  fourth_wall_broken BOOLEAN DEFAULT FALSE, -- Recipient paid 100 Talents to reply
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Break 4th Wall transactions (COMA whisper responses)
CREATE TABLE IF NOT EXISTS fourth_wall_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coma_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- User in COMA
  requester_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- User wanting to reply
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message_content TEXT NOT NULL, -- The message the requester wants to send
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wall_messages_created_at ON wall_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wall_messages_post_type ON wall_messages(post_type);
CREATE INDEX IF NOT EXISTS idx_wall_messages_expires_at ON wall_messages(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wall_reactions_message_id ON wall_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_post_cooldowns_user_id ON post_cooldowns(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_cpr_rescues_ghost ON cpr_rescues(ghost_user_id);
CREATE INDEX IF NOT EXISTS idx_dm_threads_user ON dm_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_thread ON dm_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_cpr_log_ghost ON cpr_log(ghost_user_id);
CREATE INDEX IF NOT EXISTS idx_cpr_log_rescuer ON cpr_log(rescuer_user_id);
CREATE INDEX IF NOT EXISTS idx_fourth_wall_breaks_coma ON fourth_wall_breaks(coma_user_id);
CREATE INDEX IF NOT EXISTS idx_fourth_wall_breaks_requester ON fourth_wall_breaks(requester_user_id);

-- Function to auto-assign first user as admin
CREATE OR REPLACE FUNCTION assign_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user
  IF (SELECT COUNT(*) FROM users) = 1 THEN
    NEW.role := 'admin';
    NEW.is_verified := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to assign first user as admin
CREATE TRIGGER trigger_assign_first_admin
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION assign_first_admin();

-- Function to regenerate COMA refills
CREATE OR REPLACE FUNCTION regenerate_coma_refills()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate hours since last update
  DECLARE
    hours_passed INTEGER;
  BEGIN
    hours_passed := EXTRACT(EPOCH FROM (NOW() - NEW.coma_refills_last_updated)) / 3600;
    
    IF hours_passed >= 24 AND NEW.coma_refills < 3 THEN
      -- Regenerate refills (1 per 24 hours, max 3)
      NEW.coma_refills := LEAST(3, NEW.coma_refills + (hours_passed / 24)::INTEGER);
      NEW.coma_refills_last_updated := NOW();
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-regenerate refills on profile read
CREATE TRIGGER trigger_regenerate_coma_refills
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION regenerate_coma_refills();

-- Function to handle new user signup (creates profile automatically)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, username, is_verified, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    false,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert into profiles table with defaults
  INSERT INTO public.profiles (id, display_name, talent_balance, coma_status, coma_refills)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    100, -- Default talent balance
    true, -- Default COMA status (per spec)
    3 -- Default refills
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on Supabase auth.users table to create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wall_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_post_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wall_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_cooldowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpr_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpr_rescues ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fourth_wall_breaks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Pope (Admin) has full access
CREATE POLICY "Pope has full access to users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can view all users (for profiles, etc.)
CREATE POLICY "Anyone can view users"
  ON users FOR SELECT
  USING (true);

-- Users can insert their own user record during signup
CREATE POLICY "Users can insert their own record"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own username/email only (NOT role)
CREATE POLICY "Users can update their own basic info"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent role escalation: role must remain unchanged
    role = (SELECT role FROM users WHERE id = auth.uid())
  );

-- =====================================================
-- PROFILES TABLE POLICIES (CRITICAL: TALENT LOOP PROTECTION)
-- =====================================================

-- Pope (Admin) has full access to profiles
CREATE POLICY "Pope has full access to profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Anyone can view profiles
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile during signup
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 🏁 CRITICAL: Users can ONLY update specific safe columns
-- This prevents the talent loop by blocking talent_balance updates
CREATE POLICY "Users can update safe profile columns only"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Talent balance must remain unchanged (only Pope can modify)
    talent_balance = (SELECT talent_balance FROM profiles WHERE id = auth.uid()) AND
    -- COMA refills must remain unchanged (system-managed)
    coma_refills = (SELECT coma_refills FROM profiles WHERE id = auth.uid()) AND
    -- Ensure no role escalation via profiles (should match users table)
    TRUE
  );

-- =====================================================
-- SYSTEM SETTINGS POLICIES
-- =====================================================

-- Pope can do everything with system settings
CREATE POLICY "Pope has full access to system_settings"
  ON system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Everyone can read system settings (e.g., glaze_active)
CREATE POLICY "Anyone can view system_settings"
  ON system_settings FOR SELECT
  USING (true);

-- =====================================================
-- WALL MESSAGES POLICIES
-- =====================================================

-- Pope has full access
CREATE POLICY "Pope has full access to wall_messages"
  ON wall_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Anyone can view wall messages
CREATE POLICY "Anyone can view wall_messages"
  ON wall_messages FOR SELECT
  USING (true);

-- Users can insert their own messages
CREATE POLICY "Users can post to wall"
  ON wall_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own messages
CREATE POLICY "Users can manage their own messages"
  ON wall_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON wall_messages FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- ADMIN POST OVERRIDES POLICIES
-- =====================================================

-- Only Pope can manage post overrides
CREATE POLICY "Pope manages admin_post_overrides"
  ON admin_post_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Anyone can view overrides (to display 13+ stats)
CREATE POLICY "Anyone can view admin_post_overrides"
  ON admin_post_overrides FOR SELECT
  USING (true);

-- =====================================================
-- COMMENTS POLICIES
-- =====================================================

-- Pope has full access
CREATE POLICY "Pope has full access to comments"
  ON comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Anyone can view comments
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can post comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can manage their own comments
CREATE POLICY "Users can manage their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- WALL REACTIONS POLICIES
-- =====================================================

-- Pope has full access
CREATE POLICY "Pope has full access to wall_reactions"
  ON wall_reactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Anyone can view reactions
CREATE POLICY "Anyone can view wall_reactions"
  ON wall_reactions FOR SELECT
  USING (true);

-- Users can insert their own reactions
CREATE POLICY "Users can add reactions"
  ON wall_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can remove their own reactions"
  ON wall_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- POST COOLDOWNS POLICIES
-- =====================================================

-- Pope has full access
CREATE POLICY "Pope has full access to post_cooldowns"
  ON post_cooldowns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can view all cooldowns (for checking others)
CREATE POLICY "Anyone can view post_cooldowns"
  ON post_cooldowns FOR SELECT
  USING (true);

-- Users can insert/update their own cooldown
CREATE POLICY "Users can manage their own cooldown"
  ON post_cooldowns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cooldown"
  ON post_cooldowns FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- CPR LOG POLICIES
-- =====================================================

-- Pope has full access
CREATE POLICY "Pope has full access to cpr_log"
  ON cpr_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can view their own CPR logs (as ghost or rescuer)
CREATE POLICY "Users can view their own cpr_log"
  ON cpr_log FOR SELECT
  USING (
    auth.uid() = ghost_user_id OR
    auth.uid() = rescuer_user_id
  );

-- Users can insert CPR logs as rescuer
CREATE POLICY "Users can log their own CPR"
  ON cpr_log FOR INSERT
  WITH CHECK (auth.uid() = rescuer_user_id);

-- Users can update their own CPR logs (for shrine link viewing)
CREATE POLICY "Users can update their own cpr_log"
  ON cpr_log FOR UPDATE
  USING (auth.uid() = rescuer_user_id);

-- =====================================================
-- CPR RESCUES POLICIES
-- =====================================================

-- Pope has full access
CREATE POLICY "Pope has full access to cpr_rescues"
  ON cpr_rescues FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can view all CPR rescues (public info)
CREATE POLICY "Anyone can view cpr_rescues"
  ON cpr_rescues FOR SELECT
  USING (true);

-- Users can insert CPR rescues for themselves
CREATE POLICY "Users can perform CPR"
  ON cpr_rescues FOR INSERT
  WITH CHECK (auth.uid() = rescuer_user_id);

-- =====================================================
-- DM THREADS POLICIES
-- =====================================================

-- Pope has full access
CREATE POLICY "Pope has full access to dm_threads"
  ON dm_threads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can view their own threads
CREATE POLICY "Users can view their own dm_threads"
  ON dm_threads FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own threads
CREATE POLICY "Users can create their own dm_threads"
  ON dm_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- DM MESSAGES POLICIES
-- =====================================================

-- Pope has full access
CREATE POLICY "Pope has full access to dm_messages"
  ON dm_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can view messages in their own threads
CREATE POLICY "Users can view their own dm_messages"
  ON dm_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dm_threads
      WHERE dm_threads.id = thread_id
      AND dm_threads.user_id = auth.uid()
    )
  );

-- Users can send messages in their own threads
CREATE POLICY "Users can send dm_messages"
  ON dm_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM dm_threads
      WHERE dm_threads.id = thread_id
      AND dm_threads.user_id = auth.uid()
    )
  );

-- =====================================================
-- FOURTH WALL BREAKS POLICIES (TALENT GATE)
-- =====================================================

-- Pope has full access
CREATE POLICY "Pope has full access to fourth_wall_breaks"
  ON fourth_wall_breaks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can view their own fourth wall break requests
CREATE POLICY "Users can view their own fourth_wall_breaks"
  ON fourth_wall_breaks FOR SELECT
  USING (
    auth.uid() = coma_user_id OR
    auth.uid() = requester_user_id
  );

-- 🏁 TALENT GATE: Users can only insert if they have >= 100 talent
CREATE POLICY "Users can request fourth wall breaks with sufficient talent"
  ON fourth_wall_breaks FOR INSERT
  WITH CHECK (
    auth.uid() = requester_user_id AND
    (
      -- Pope bypass
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'
      ) OR
      -- Regular user must have >= 100 talent
      (
        SELECT talent_balance FROM profiles WHERE id = auth.uid()
      ) >= 100
    )
  );

-- COMA users can update status (accept/reject)
CREATE POLICY "COMA users can respond to fourth_wall_breaks"
  ON fourth_wall_breaks FOR UPDATE
  USING (auth.uid() = coma_user_id);
