-- =====================================================
-- 6713 COMPLETE DATABASE - SINGLE FILE DEPLOYMENT
-- =====================================================
-- Everything in one file - just copy/paste and run
-- =====================================================

-- =====================================================
-- STEP 1: BASE SCHEMA (Profiles + Core Tables)
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

-- Add all profile columns
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

-- =====================================================
-- STEP 2: WALL CHAT (Messages, Reactions, Transactions)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.wall_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS is_slashed BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS slashed_by UUID;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS slashed_at TIMESTAMPTZ;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS slash_reason TEXT;
  ALTER TABLE public.wall_messages ADD COLUMN IF NOT EXISTS original_content TEXT;
END $$;

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
CREATE INDEX IF NOT EXISTS idx_wall_messages_slashed ON wall_messages(is_slashed, created_at DESC) WHERE is_slashed = TRUE;

-- Wall reactions
CREATE TABLE IF NOT EXISTS public.wall_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist
DO $$
BEGIN
  ALTER TABLE public.wall_reactions ADD COLUMN IF NOT EXISTS reaction_type TEXT DEFAULT 'like';
END $$;

-- Add constraints AFTER columns exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wall_reactions_unique') THEN
    ALTER TABLE public.wall_reactions ADD CONSTRAINT wall_reactions_unique UNIQUE(message_id, user_id, reaction_type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wall_reactions_type_check') THEN
    ALTER TABLE public.wall_reactions ADD CONSTRAINT wall_reactions_type_check CHECK (reaction_type IN ('like', 'crown'));
  END IF;
END $$;

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

DO $$
BEGIN
  ALTER TABLE public.talent_transactions ADD COLUMN IF NOT EXISTS sender_id UUID;
  ALTER TABLE public.talent_transactions ADD COLUMN IF NOT EXISTS recipient_id UUID;
  ALTER TABLE public.talent_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT;
  ALTER TABLE public.talent_transactions ADD COLUMN IF NOT EXISTS reference_id UUID;
  ALTER TABLE public.talent_transactions ADD COLUMN IF NOT EXISTS description TEXT;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'talent_transactions_type_check') THEN
    ALTER TABLE public.talent_transactions ADD CONSTRAINT talent_transactions_type_check CHECK (transaction_type IN ('throw', 'purchase', 'reward', 'admin_gift', 'system', 'reveal', 'gig_payment'));
  END IF;
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
-- STEP 3: WALL CHAT HEARTBEAT (Presence, Stories)
-- =====================================================

CREATE TABLE IF NOT EXISTS wall_story_sliders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slider_position INTEGER NOT NULL,
  story_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wall_story_sliders_position ON wall_story_sliders(slider_position DESC);
CREATE INDEX IF NOT EXISTS idx_wall_story_sliders_created_at ON wall_story_sliders(created_at DESC);

CREATE TABLE IF NOT EXISTS wall_typing_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  started_typing_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wall_typing_last_heartbeat ON wall_typing_presence(last_heartbeat DESC);

CREATE TABLE IF NOT EXISTS wall_online_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wall_online_last_seen ON wall_online_presence(last_seen DESC);

CREATE OR REPLACE FUNCTION cleanup_stale_typing_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM wall_typing_presence WHERE last_heartbeat < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: SEARCH SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  search_query TEXT NOT NULL,
  search_type TEXT NOT NULL,
  result_id UUID,
  result_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'search_history_type_check') THEN
    ALTER TABLE search_history ADD CONSTRAINT search_history_type_check CHECK (search_type IN ('human', 'sound', 'tag', 'gig'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_type ON search_history(search_type);

DROP TRIGGER IF EXISTS auto_clean_search_history ON search_history;
DROP FUNCTION IF EXISTS maintain_search_history();

CREATE OR REPLACE FUNCTION maintain_search_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM search_history
  WHERE id IN (
    SELECT id FROM search_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_clean_search_history
  AFTER INSERT ON search_history
  FOR EACH ROW
  EXECUTE FUNCTION maintain_search_history();

CREATE TABLE IF NOT EXISTS volatile_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  is_trending BOOLEAN DEFAULT FALSE,
  language_code TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volatile_tags_trending ON volatile_tags(is_trending, usage_count DESC) WHERE is_trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_volatile_tags_language ON volatile_tags(language_code, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_volatile_tags_usage ON volatile_tags(usage_count DESC);

CREATE TABLE IF NOT EXISTS slashed_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  slashed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  slash_reason TEXT,
  slashed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slashed_tags_tag ON slashed_tags(tag);

-- Search function
DROP FUNCTION IF EXISTS search_humans(text);

CREATE OR REPLACE FUNCTION search_humans(search_term TEXT)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  nickname TEXT,
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  is_verified BOOLEAN,
  profile_photo_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    get_username(p.id),
    p.nickname,
    p.first_name,
    p.last_name,
    p.bio,
    (p.verified_at IS NOT NULL) AS is_verified,
    p.profile_photo_url
  FROM profiles p
  WHERE 
    p.deactivated_at IS NULL
    AND p.coma_status = FALSE
    AND (
      LOWER(get_username(p.id)) LIKE '%' || LOWER(search_term) || '%'
      OR LOWER(p.first_name) LIKE '%' || LOWER(search_term) || '%'
      OR LOWER(p.last_name) LIKE '%' || LOWER(search_term) || '%'
      OR LOWER(p.nickname) LIKE '%' || LOWER(search_term) || '%'
    )
  ORDER BY 
    (p.verified_at IS NOT NULL) DESC,
    p.created_at ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 5: PULSE CHAT SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS system_accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  accent_color TEXT,
  is_pinned BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'system_accounts_type_check') THEN
    ALTER TABLE system_accounts ADD CONSTRAINT system_accounts_type_check CHECK (account_type IN ('banker', 'pope_ai'));
  END IF;
END $$;

INSERT INTO system_accounts (account_type, display_name, description, accent_color)
VALUES 
  ('banker', '$$$', 'Your private line to the Admin for manual Talent buying', '#D4AF37'),
  ('pope_ai', 'Pope AI', 'Your 24/7 assistant for navigating the 6713 rules and the CPR cycle', '#9333EA')
ON CONFLICT (account_type) DO NOTHING;

CREATE TABLE IF NOT EXISTS chat_threads (
  thread_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  other_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  system_account_id UUID REFERENCES system_accounts(account_id),
  nickname_for_other TEXT,
  is_system_thread BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  total_qt_seconds INTEGER DEFAULT 0
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_threads_valid_thread') THEN
    ALTER TABLE chat_threads ADD CONSTRAINT chat_threads_valid_thread CHECK (
      (other_user_id IS NOT NULL AND system_account_id IS NULL) OR
      (other_user_id IS NULL AND system_account_id IS NOT NULL)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_threads_unique_user_thread') THEN
    ALTER TABLE chat_threads ADD CONSTRAINT chat_threads_unique_user_thread UNIQUE(user_id, other_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_threads_unique_system_thread') THEN
    ALTER TABLE chat_threads ADD CONSTRAINT chat_threads_unique_system_thread UNIQUE(user_id, system_account_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_threads_user ON chat_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_message ON chat_threads(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_system ON chat_threads(user_id, is_system_thread) WHERE is_system_thread = TRUE;

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES chat_threads(thread_id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_system_message BOOLEAN DEFAULT FALSE,
  message_text TEXT,
  media_url TEXT,
  media_type TEXT,
  media_thumbnail TEXT,
  post_id UUID,
  is_slashed BOOLEAN DEFAULT FALSE,
  slashed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  slashed_at TIMESTAMPTZ,
  slash_reason TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_media_type_check') THEN
    ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_media_type_check CHECK (media_type IN ('photo', 'video', 'link'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(thread_id, is_read) WHERE is_read = FALSE;

-- =====================================================
-- SUCCESS! Complete database deployed
-- =====================================================

SELECT '✅ ALL MIGRATIONS DEPLOYED - Database ready!' as status;
