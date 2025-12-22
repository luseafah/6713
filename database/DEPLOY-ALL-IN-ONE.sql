-- =====================================================
-- 6713 COMPLETE DATABASE DEPLOYMENT
-- =====================================================
-- Run this ENTIRE file in Supabase SQL Editor
-- Copy/paste everything below and click "Run"
-- =====================================================

-- =====================================================
-- STEP 1: MASTER INITIALIZATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user',
  is_admin BOOLEAN DEFAULT FALSE,
  is_mod BOOLEAN DEFAULT FALSE,
  talent_balance INTEGER DEFAULT 100,
  coma_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (safe for existing tables)
DO $$ 
BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wiki TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocker_preference TEXT DEFAULT 'black';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coma_reason TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coma_entered_at TIMESTAMPTZ;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coma_exited_at TIMESTAMPTZ;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coma_refills INTEGER DEFAULT 3;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coma_refills_last_updated TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coma_cost INTEGER DEFAULT 50;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shrine_link TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shrine_media TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_shrine_edit TIMESTAMPTZ;
END $$;

-- Add constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_nickname_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_nickname_check CHECK (LENGTH(nickname) <= 10);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_blocker_preference_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_blocker_preference_check CHECK (blocker_preference IN ('black', 'white'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_coma_reason_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_coma_reason_check CHECK (coma_reason IN ('Choice', 'Quest', NULL));
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified_at) WHERE verified_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON profiles(last_name);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, talent_balance, coma_status, is_admin, is_mod)
  VALUES (NEW.id, 'user', 100, FALSE, FALSE, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Helper functions
CREATE OR REPLACE FUNCTION get_username(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT raw_user_meta_data->>'username' FROM auth.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_by_username(p_username TEXT)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM auth.users 
    WHERE LOWER(raw_user_meta_data->>'username') = LOWER(p_username)
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT COALESCE(is_admin, FALSE) FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Core tables
CREATE TABLE IF NOT EXISTS public.wall_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist
DO $$
BEGIN
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS media_url TEXT;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'wall';
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS is_pope_ai BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS is_coma_whisper BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS admin_rigged_stats BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES wall_messages(id) ON DELETE SET NULL;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS is_slashed BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS slashed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS slashed_at TIMESTAMPTZ;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS slash_reason TEXT;
END $$;

-- Add constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wall_messages_message_type_check') THEN
    ALTER TABLE public.wall_messages ADD CONSTRAINT wall_messages_message_type_check CHECK (message_type IN ('text', 'voice', 'picture', 'system'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wall_messages_post_type_check') THEN
    ALTER TABLE public.wall_messages ADD CONSTRAINT wall_messages_post_type_check CHECK (post_type IN ('wall', 'story'));
  END IF;
END $$;

ALTER TABLE public.wall_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view wall messages" ON public.wall_messages;
CREATE POLICY "Anyone can view wall messages" ON public.wall_messages FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can insert wall messages" ON public.wall_messages;
CREATE POLICY "Authenticated users can insert wall messages" ON public.wall_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own messages" ON public.wall_messages;
CREATE POLICY "Users can update their own messages" ON public.wall_messages FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update any message" ON public.wall_messages;
CREATE POLICY "Admins can update any message" ON public.wall_messages FOR UPDATE
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

DROP POLICY IF EXISTS "Users can delete their own messages" ON public.wall_messages;
CREATE POLICY "Users can delete their own messages" ON public.wall_messages FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wall_messages_user ON wall_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_wall_messages_created ON wall_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wall_messages_post_type ON wall_messages(post_type);
CREATE INDEX IF NOT EXISTS idx_wall_messages_expires ON wall_messages(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wall_messages_reply ON wall_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Wall reactions
CREATE TABLE IF NOT EXISTS public.wall_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'crown')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_type)
);

ALTER TABLE public.wall_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.wall_reactions;
CREATE POLICY "Anyone can view reactions" ON public.wall_reactions FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can create reactions" ON public.wall_reactions;
CREATE POLICY "Authenticated users can create reactions" ON public.wall_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.wall_reactions;
CREATE POLICY "Users can delete their own reactions" ON public.wall_reactions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON wall_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON wall_reactions(user_id);

-- Talent transactions
CREATE TABLE IF NOT EXISTS public.talent_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist
DO $$
BEGIN
  ALTER TABLE public.talent_transactions ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  ALTER TABLE public.talent_transactions ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  ALTER TABLE public.talent_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT;
  ALTER TABLE public.talent_transactions ADD COLUMN IF NOT EXISTS reference_id UUID;
  ALTER TABLE public.talent_transactions ADD COLUMN IF NOT EXISTS description TEXT;
END $$;

-- Add constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'talent_transactions_type_check') THEN
    ALTER TABLE public.talent_transactions ADD CONSTRAINT talent_transactions_type_check CHECK (transaction_type IN ('throw', 'purchase', 'reward', 'admin_gift', 'system', 'reveal', 'gig_payment'));
  END IF;
END $$;

-- Set NOT NULL on transaction_type if not already set
DO $$
BEGIN
  ALTER TABLE public.talent_transactions ALTER COLUMN transaction_type SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

ALTER TABLE public.talent_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.talent_transactions;
CREATE POLICY "Users can view their own transactions" ON public.talent_transactions FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.talent_transactions;
CREATE POLICY "Admins can view all transactions" ON public.talent_transactions FOR SELECT
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

DROP POLICY IF EXISTS "System can insert transactions" ON public.talent_transactions;
CREATE POLICY "System can insert transactions" ON public.talent_transactions FOR INSERT WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS idx_talent_tx_sender ON talent_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_talent_tx_recipient ON talent_transactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_talent_tx_created ON talent_transactions(created_at DESC);

-- System settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;
CREATE POLICY "Anyone can view system settings" ON public.system_settings FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Only admins can modify system settings" ON public.system_settings;
CREATE POLICY "Only admins can modify system settings" ON public.system_settings FOR ALL
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

INSERT INTO system_settings (setting_key, setting_value) 
VALUES ('glaze_active', FALSE)
ON CONFLICT (setting_key) DO NOTHING;

-- Throw talents function
DROP FUNCTION IF EXISTS throw_talents(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION throw_talents(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount INTEGER
) RETURNS JSON AS $$
DECLARE
  v_sender_balance INTEGER;
  v_recipient_balance INTEGER;
BEGIN
  SELECT talent_balance INTO v_sender_balance FROM profiles WHERE id = p_sender_id;
  
  IF v_sender_balance < p_amount THEN
    RETURN json_build_object('success', FALSE, 'error', 'Insufficient Talents');
  END IF;
  
  UPDATE profiles SET talent_balance = talent_balance - p_amount WHERE id = p_sender_id RETURNING talent_balance INTO v_sender_balance;
  UPDATE profiles SET talent_balance = talent_balance + p_amount WHERE id = p_recipient_id RETURNING talent_balance INTO v_recipient_balance;
  
  INSERT INTO talent_transactions (sender_id, recipient_id, amount, transaction_type)
  VALUES (p_sender_id, p_recipient_id, p_amount, 'throw');
  
  RETURN json_build_object('success', TRUE, 'sender_balance', v_sender_balance, 'recipient_balance', v_recipient_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS! Master schema initialized.
-- Now run the 4 feature migrations in Supabase Dashboard:
-- 1. migration-wall-chat-heartbeat.sql
-- 2. migration-hamburger-search.sql
-- 3. migration-profile-page.sql
-- 4. migration-pulse-chat.sql
-- =====================================================

SELECT '✅ MASTER SCHEMA DEPLOYED - Run feature migrations next!' as status;
