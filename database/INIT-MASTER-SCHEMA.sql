-- =====================================================
-- 6713 MASTER INITIALIZATION SCHEMA
-- =====================================================
-- Run this FIRST in a fresh Supabase project
-- This creates the base structure that all other migrations depend on
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE (Links to auth.users)
-- =====================================================
-- Supabase manages auth.users automatically
-- We create profiles that link to it

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role & Status
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_admin BOOLEAN DEFAULT FALSE,
  is_mod BOOLEAN DEFAULT FALSE,
  
  -- Identity
  verified_at TIMESTAMPTZ, -- When user was verified by Pope AI
  verified_name TEXT, -- Legal name for Radio/Gigs
  first_name TEXT,
  last_name TEXT,
  nickname TEXT CHECK (LENGTH(nickname) <= 10), -- 10 char Wall identifier
  bio TEXT,
  wiki TEXT, -- Personal wiki/bio
  
  -- Visual
  profile_photo_url TEXT,
  blocker_preference TEXT DEFAULT 'black' CHECK (blocker_preference IN ('black', 'white')),
  
  -- Economy
  talent_balance INTEGER DEFAULT 100,
  
  -- COMA System
  coma_status BOOLEAN DEFAULT FALSE,
  coma_reason TEXT CHECK (coma_reason IN ('Choice', 'Quest', NULL)),
  coma_entered_at TIMESTAMPTZ,
  coma_exited_at TIMESTAMPTZ,
  coma_refills INTEGER DEFAULT 3,
  coma_refills_last_updated TIMESTAMPTZ DEFAULT NOW(),
  coma_cost INTEGER DEFAULT 50,
  
  -- Self-Kill & Shrine
  deactivated_at TIMESTAMPTZ, -- 72-hour void lockout
  shrine_link TEXT,
  shrine_media TEXT,
  last_shrine_edit TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified_at) WHERE verified_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON profiles(last_name);

-- =====================================================
-- 2. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, talent_balance, coma_status, is_admin, is_mod)
  VALUES (
    NEW.id,
    'user',
    100,
    FALSE,
    FALSE,
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. WALL MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.wall_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  content TEXT NOT NULL,
  media_url TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'picture', 'system')),
  post_type TEXT DEFAULT 'wall' CHECK (post_type IN ('wall', 'story')),
  
  -- Timing
  expires_at TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT FALSE,
  
  -- Special Flags
  is_pope_ai BOOLEAN DEFAULT FALSE,
  is_coma_whisper BOOLEAN DEFAULT FALSE,
  admin_rigged_stats BOOLEAN DEFAULT FALSE,
  
  -- Reply Chain
  reply_to_id UUID REFERENCES wall_messages(id) ON DELETE SET NULL,
  
  -- Moderation
  is_slashed BOOLEAN DEFAULT FALSE,
  slashed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  slashed_at TIMESTAMPTZ,
  slash_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wall_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wall_messages
CREATE POLICY "Anyone can view wall messages"
  ON public.wall_messages FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can insert wall messages"
  ON public.wall_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON public.wall_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any message"
  ON public.wall_messages FOR UPDATE
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

CREATE POLICY "Users can delete their own messages"
  ON public.wall_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for wall_messages
CREATE INDEX IF NOT EXISTS idx_wall_messages_user ON wall_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_wall_messages_created ON wall_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wall_messages_post_type ON wall_messages(post_type);
CREATE INDEX IF NOT EXISTS idx_wall_messages_expires ON wall_messages(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wall_messages_reply ON wall_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- =====================================================
-- 4. WALL REACTIONS (LIKES)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.wall_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'crown')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(message_id, user_id, reaction_type)
);

-- Enable RLS
ALTER TABLE public.wall_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view reactions"
  ON public.wall_reactions FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can create reactions"
  ON public.wall_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON public.wall_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reactions_message ON wall_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON wall_reactions(user_id);

-- =====================================================
-- 5. TALENT TRANSACTIONS LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS public.talent_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('throw', 'purchase', 'reward', 'admin_gift', 'system', 'reveal', 'gig_payment')),
  reference_id UUID, -- Related entity (gig, message, etc)
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.talent_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
  ON public.talent_transactions FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Admins can view all transactions"
  ON public.talent_transactions FOR SELECT
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

CREATE POLICY "System can insert transactions"
  ON public.talent_transactions FOR INSERT
  WITH CHECK (TRUE);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_talent_tx_sender ON talent_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_talent_tx_recipient ON talent_transactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_talent_tx_created ON talent_transactions(created_at DESC);

-- =====================================================
-- 6. SYSTEM SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view system settings"
  ON public.system_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Only admins can modify system settings"
  ON public.system_settings FOR ALL
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value) 
VALUES ('glaze_active', FALSE)
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function: Get username from auth.users metadata
CREATE OR REPLACE FUNCTION get_username(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'username'
    FROM auth.users
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Get user ID by username
CREATE OR REPLACE FUNCTION get_user_by_username(p_username TEXT)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id
    FROM auth.users
    WHERE LOWER(raw_user_meta_data->>'username') = LOWER(p_username)
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(is_admin, FALSE)
    FROM profiles
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Throw Talents between users
CREATE OR REPLACE FUNCTION throw_talents(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount INTEGER
) RETURNS JSON AS $$
DECLARE
  v_sender_balance INTEGER;
  v_recipient_balance INTEGER;
BEGIN
  -- Check sender balance
  SELECT talent_balance INTO v_sender_balance
  FROM profiles
  WHERE id = p_sender_id;
  
  IF v_sender_balance < p_amount THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Insufficient Talents'
    );
  END IF;
  
  -- Deduct from sender
  UPDATE profiles
  SET talent_balance = talent_balance - p_amount
  WHERE id = p_sender_id
  RETURNING talent_balance INTO v_sender_balance;
  
  -- Add to recipient
  UPDATE profiles
  SET talent_balance = talent_balance + p_amount
  WHERE id = p_recipient_id
  RETURNING talent_balance INTO v_recipient_balance;
  
  -- Log transaction
  INSERT INTO talent_transactions (sender_id, recipient_id, amount, transaction_type)
  VALUES (p_sender_id, p_recipient_id, p_amount, 'throw');
  
  RETURN json_build_object(
    'success', TRUE,
    'sender_balance', v_sender_balance,
    'recipient_balance', v_recipient_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. ENABLE REALTIME (for subscriptions)
-- =====================================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE wall_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE wall_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 
  '✅ Master schema initialized successfully!' as status,
  COUNT(*) as profile_count
FROM profiles;
