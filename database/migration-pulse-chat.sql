-- =====================================================
-- Project 6713: Pulse (Chat) Database Migration
-- =====================================================
-- Purpose: Complete infrastructure for the Pulse/Chat system
-- Features:
--   1. System Accounts ($$$, Pope AI) - Fixed pillars
--   2. Threads with nickname-first display
--   3. Messages with Pretty Links and admin slashing
--   4. QT conversation tracking (dwell time in thread)
--   5. Manual talent injection ($$$ chat)
-- =====================================================

-- =====================================================
-- 1. SYSTEM ACCOUNTS TABLE
-- =====================================================
-- Special accounts: $$$, Pope AI

CREATE TABLE IF NOT EXISTS system_accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type TEXT UNIQUE NOT NULL CHECK (account_type IN ('banker', 'pope_ai')),
  display_name TEXT NOT NULL, -- "$$$" or "Pope AI"
  description TEXT,
  icon_url TEXT,
  accent_color TEXT, -- e.g., "#D4AF37" for gold
  is_pinned BOOLEAN DEFAULT TRUE, -- Always at top
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert system accounts
INSERT INTO system_accounts (account_type, display_name, description, accent_color)
VALUES 
  ('banker', '$$$', 'Your private line to the Admin for manual Talent buying', '#D4AF37'),
  ('pope_ai', 'Pope AI', 'Your 24/7 assistant for navigating the 6713 rules and the CPR cycle', '#9333EA')
ON CONFLICT (account_type) DO NOTHING;

-- =====================================================
-- 2. THREADS TABLE
-- =====================================================
-- Chat threads between users or with system accounts

CREATE TABLE IF NOT EXISTS chat_threads (
  thread_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  other_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system threads
  system_account_id UUID REFERENCES system_accounts(account_id), -- For $$$, Pope AI
  
  -- Nickname Display (stored per-thread)
  nickname_for_other TEXT, -- What this user calls the other person
  
  -- Thread Status
  is_system_thread BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  
  -- QT Tracking
  total_qt_seconds INTEGER DEFAULT 0, -- Total time spent in this thread
  
  -- Constraint: Either other_user_id OR system_account_id must be set
  CONSTRAINT valid_thread CHECK (
    (other_user_id IS NOT NULL AND system_account_id IS NULL) OR
    (other_user_id IS NULL AND system_account_id IS NOT NULL)
  ),
  
  -- Unique constraint: one thread per user pair (or user-system pair)
  CONSTRAINT unique_user_thread UNIQUE(user_id, other_user_id),
  CONSTRAINT unique_system_thread UNIQUE(user_id, system_account_id)
);

CREATE INDEX idx_threads_user ON chat_threads(user_id);
CREATE INDEX idx_threads_last_message ON chat_threads(user_id, last_message_at DESC);
CREATE INDEX idx_threads_system ON chat_threads(user_id, is_system_thread) WHERE is_system_thread = TRUE;

-- =====================================================
-- 3. MESSAGES TABLE
-- =====================================================
-- Individual messages within threads

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES chat_threads(thread_id) ON DELETE CASCADE,
  
  -- Sender
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL if system message
  is_system_message BOOLEAN DEFAULT FALSE,
  
  -- Content
  message_text TEXT,
  
  -- Pretty Links (photos/videos shared)
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('photo', 'video', 'link')),
  media_thumbnail TEXT,
  post_id UUID, -- Reference to original post (for Pretty Link redirect)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Moderation
  is_slashed BOOLEAN DEFAULT FALSE,
  slashed_by UUID REFERENCES auth.users(id),
  slashed_at TIMESTAMPTZ,
  slash_reason TEXT,
  
  -- Admin Features ($$$ chat)
  is_talent_injection BOOLEAN DEFAULT FALSE,
  talent_injection_amount INTEGER,
  
  CONSTRAINT message_has_content CHECK (
    message_text IS NOT NULL OR media_url IS NOT NULL OR is_talent_injection = TRUE
  )
);

CREATE INDEX idx_messages_thread ON chat_messages(thread_id, created_at DESC);
CREATE INDEX idx_messages_unread ON chat_messages(thread_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_messages_slashed ON chat_messages(thread_id, is_slashed) WHERE is_slashed = TRUE;

-- =====================================================
-- 4. CONVERSATION QT TABLE
-- =====================================================
-- Tracks dwell time in specific chat threads

CREATE TABLE IF NOT EXISTS conversation_qt (
  qt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES chat_threads(thread_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session tracking
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  dwell_seconds INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversation_qt_thread ON conversation_qt(thread_id);
CREATE INDEX idx_conversation_qt_active ON conversation_qt(thread_id, user_id) WHERE ended_at IS NULL;

-- =====================================================
-- 5. FUNCTIONS: Thread Management
-- =====================================================

-- Function: Get or Create Thread
CREATE OR REPLACE FUNCTION get_or_create_thread(
  p_user_id UUID,
  p_other_user_id UUID DEFAULT NULL,
  p_system_account_type TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_thread_id UUID;
  v_system_account_id UUID;
BEGIN
  -- Get system account ID if specified
  IF p_system_account_type IS NOT NULL THEN
    SELECT account_id INTO v_system_account_id
    FROM system_accounts
    WHERE account_type = p_system_account_type;
    
    IF v_system_account_id IS NULL THEN
      RAISE EXCEPTION 'Invalid system account type: %', p_system_account_type;
    END IF;
  END IF;
  
  -- Try to find existing thread
  IF p_other_user_id IS NOT NULL THEN
    -- User-to-user thread
    SELECT thread_id INTO v_thread_id
    FROM chat_threads
    WHERE (user_id = p_user_id AND other_user_id = p_other_user_id)
       OR (user_id = p_other_user_id AND other_user_id = p_user_id);
  ELSE
    -- System thread
    SELECT thread_id INTO v_thread_id
    FROM chat_threads
    WHERE user_id = p_user_id AND system_account_id = v_system_account_id;
  END IF;
  
  -- Create new thread if not found
  IF v_thread_id IS NULL THEN
    INSERT INTO chat_threads (
      user_id,
      other_user_id,
      system_account_id,
      is_system_thread
    )
    VALUES (
      p_user_id,
      p_other_user_id,
      v_system_account_id,
      p_system_account_type IS NOT NULL
    )
    RETURNING thread_id INTO v_thread_id;
  END IF;
  
  RETURN v_thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Thread List (with fixed pillars)
CREATE OR REPLACE FUNCTION get_thread_list(p_user_id UUID)
RETURNS TABLE (
  thread_id UUID,
  is_system_thread BOOLEAN,
  system_display_name TEXT,
  system_account_type TEXT,
  system_accent_color TEXT,
  other_user_id UUID,
  other_username TEXT,
  other_nickname TEXT,
  other_profile_photo TEXT,
  other_is_coma BOOLEAN,
  other_is_verified BOOLEAN,
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER,
  total_qt_seconds INTEGER,
  is_pinned BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  -- System threads (fixed pillars)
  SELECT
    t.thread_id,
    t.is_system_thread,
    sa.display_name AS system_display_name,
    sa.account_type AS system_account_type,
    sa.accent_color AS system_accent_color,
    NULL::UUID AS other_user_id,
    NULL::TEXT AS other_username,
    NULL::TEXT AS other_nickname,
    NULL::TEXT AS other_profile_photo,
    NULL::BOOLEAN AS other_is_coma,
    NULL::BOOLEAN AS other_is_verified,
    (SELECT message_text FROM chat_messages WHERE thread_id = t.thread_id ORDER BY created_at DESC LIMIT 1) AS last_message_text,
    t.last_message_at,
    t.unread_count,
    t.total_qt_seconds,
    sa.is_pinned
  FROM chat_threads t
  JOIN system_accounts sa ON t.system_account_id = sa.account_id
  WHERE t.user_id = p_user_id
    AND t.is_system_thread = TRUE
    AND t.is_archived = FALSE
  
  UNION ALL
  
  -- User threads (social list)
  SELECT
    t.thread_id,
    t.is_system_thread,
    NULL::TEXT AS system_display_name,
    NULL::TEXT AS system_account_type,
    NULL::TEXT AS system_accent_color,
    t.other_user_id,
    u.username AS other_username,
    COALESCE(t.nickname_for_other, p.nickname, u.username) AS other_nickname,
    p.profile_photo_url AS other_profile_photo,
    u.is_coma AS other_is_coma,
    (p.verified_name IS NOT NULL) AS other_is_verified,
    (SELECT message_text FROM chat_messages WHERE thread_id = t.thread_id ORDER BY created_at DESC LIMIT 1) AS last_message_text,
    t.last_message_at,
    t.unread_count,
    t.total_qt_seconds,
    FALSE AS is_pinned
  FROM chat_threads t
  LEFT JOIN auth.users u ON t.other_user_id = u.id
  LEFT JOIN profiles p ON u.id = p.id
  WHERE t.user_id = p_user_id
    AND t.is_system_thread = FALSE
    AND t.is_archived = FALSE
  
  ORDER BY is_pinned DESC NULLS LAST, last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. FUNCTIONS: Message Management
-- =====================================================

-- Function: Send Message
CREATE OR REPLACE FUNCTION send_message(
  p_thread_id UUID,
  p_sender_id UUID,
  p_message_text TEXT DEFAULT NULL,
  p_media_url TEXT DEFAULT NULL,
  p_media_type TEXT DEFAULT NULL,
  p_post_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Insert message
  INSERT INTO chat_messages (
    thread_id,
    sender_id,
    message_text,
    media_url,
    media_type,
    post_id
  )
  VALUES (
    p_thread_id,
    p_sender_id,
    p_message_text,
    p_media_url,
    p_media_type,
    p_post_id
  )
  RETURNING message_id INTO v_message_id;
  
  -- Update thread last_message_at
  UPDATE chat_threads
  SET last_message_at = NOW(),
      unread_count = unread_count + 1
  WHERE thread_id = p_thread_id
    AND user_id != p_sender_id; -- Don't increment for sender
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Messages in Thread
CREATE OR REPLACE FUNCTION get_thread_messages(
  p_thread_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  message_id UUID,
  sender_id UUID,
  sender_username TEXT,
  sender_nickname TEXT,
  sender_profile_photo TEXT,
  is_system_message BOOLEAN,
  message_text TEXT,
  media_url TEXT,
  media_type TEXT,
  media_thumbnail TEXT,
  post_id UUID,
  created_at TIMESTAMPTZ,
  is_slashed BOOLEAN,
  slashed_by_username TEXT,
  is_talent_injection BOOLEAN,
  talent_injection_amount INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.message_id,
    m.sender_id,
    u.username AS sender_username,
    p.nickname AS sender_nickname,
    p.profile_photo_url AS sender_profile_photo,
    m.is_system_message,
    m.message_text,
    m.media_url,
    m.media_type,
    m.media_thumbnail,
    m.post_id,
    m.created_at,
    m.is_slashed,
    slasher_u.raw_user_meta_data->>'username' AS slashed_by_username,
    m.is_talent_injection,
    m.talent_injection_amount
  FROM chat_messages m
  LEFT JOIN auth.users u ON m.sender_id = u.id
  LEFT JOIN profiles p ON u.id = p.id
  LEFT JOIN auth.users slasher_u ON m.slashed_by = slasher_u.id
  WHERE m.thread_id = p_thread_id
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark Messages as Read
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_thread_id UUID,
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Update messages
  WITH updated AS (
    UPDATE chat_messages
    SET is_read = TRUE,
        read_at = NOW()
    WHERE thread_id = p_thread_id
      AND sender_id != p_user_id
      AND is_read = FALSE
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM updated;
  
  -- Reset unread count on thread
  UPDATE chat_threads
  SET unread_count = 0
  WHERE thread_id = p_thread_id
    AND user_id = p_user_id;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. FUNCTIONS: QT Conversation Tracking
-- =====================================================

-- Function: Start Conversation QT
CREATE OR REPLACE FUNCTION start_conversation_qt(
  p_thread_id UUID,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_qt_id UUID;
BEGIN
  INSERT INTO conversation_qt (thread_id, user_id)
  VALUES (p_thread_id, p_user_id)
  RETURNING qt_id INTO v_qt_id;
  
  RETURN v_qt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update Conversation QT
CREATE OR REPLACE FUNCTION update_conversation_qt(
  p_qt_id UUID,
  p_additional_seconds INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE conversation_qt
  SET dwell_seconds = dwell_seconds + p_additional_seconds
  WHERE qt_id = p_qt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: End Conversation QT
CREATE OR REPLACE FUNCTION end_conversation_qt(p_qt_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_dwell_seconds INTEGER;
  v_thread_id UUID;
BEGIN
  -- Get dwell time and thread
  SELECT dwell_seconds, thread_id
  INTO v_dwell_seconds, v_thread_id
  FROM conversation_qt
  WHERE qt_id = p_qt_id;
  
  -- Mark as ended
  UPDATE conversation_qt
  SET ended_at = NOW()
  WHERE qt_id = p_qt_id;
  
  -- Add to thread total
  UPDATE chat_threads
  SET total_qt_seconds = total_qt_seconds + v_dwell_seconds
  WHERE thread_id = v_thread_id;
  
  RETURN v_dwell_seconds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FUNCTIONS: Admin Features
-- =====================================================

-- Function: Admin Slash Message
CREATE OR REPLACE FUNCTION admin_slash_message(
  p_admin_user_id UUID,
  p_message_id UUID,
  p_slash_reason TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verify admin status
  SELECT is_admin OR is_mod INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_user_id;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', FALSE, 'error', 'Unauthorized');
  END IF;
  
  -- Slash the message
  UPDATE chat_messages
  SET
    is_slashed = TRUE,
    slashed_by = p_admin_user_id,
    slashed_at = NOW(),
    slash_reason = p_slash_reason
  WHERE message_id = p_message_id;
  
  RETURN json_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Admin Inject Talents ($$$ chat)
CREATE OR REPLACE FUNCTION banker_inject_talents(
  p_admin_user_id UUID,
  p_recipient_user_id UUID,
  p_talent_amount INTEGER,
  p_reason TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_thread_id UUID;
  v_message_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Verify admin status
  SELECT is_admin INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_user_id;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', FALSE, 'error', 'Unauthorized');
  END IF;
  
  -- Update user's talent balance
  UPDATE users
  SET talent_balance = talent_balance + p_talent_amount
  WHERE user_id = p_recipient_user_id
  RETURNING talent_balance INTO v_new_balance;
  
  -- Get $$$ thread
  SELECT get_or_create_thread(p_recipient_user_id, NULL, 'banker') INTO v_thread_id;
  
  -- Create system message in $$$ chat
  INSERT INTO chat_messages (
    thread_id,
    sender_id,
    is_system_message,
    message_text,
    is_talent_injection,
    talent_injection_amount
  )
  VALUES (
    v_thread_id,
    NULL,
    TRUE,
    COALESCE(p_reason, 'Manual talent injection'),
    TRUE,
    p_talent_amount
  )
  RETURNING message_id INTO v_message_id;
  
  -- Update thread timestamp
  UPDATE chat_threads
  SET last_message_at = NOW()
  WHERE thread_id = v_thread_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'new_balance', v_new_balance,
    'amount', p_talent_amount,
    'message_id', v_message_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Pope AI Auto-Response
CREATE OR REPLACE FUNCTION pope_ai_respond(
  p_user_id UUID,
  p_user_message TEXT
) RETURNS UUID AS $$
DECLARE
  v_thread_id UUID;
  v_response TEXT;
  v_message_id UUID;
BEGIN
  -- Get Pope AI thread
  SELECT get_or_create_thread(p_user_id, NULL, 'pope_ai') INTO v_thread_id;
  
  -- Generate response (simple keyword matching for now)
  IF p_user_message ILIKE '%cpr%' OR p_user_message ILIKE '%revival%' THEN
    v_response := 'The CPR system allows you to revive your account after deactivation. You need 13 revival interactions from friends to fully restore your account. Your progress is tracked in your profile.';
  ELSIF p_user_message ILIKE '%talent%' OR p_user_message ILIKE '%💎%' THEN
    v_response := 'Talents are the currency of 6713. Earn them by creating quality content and engaging with the community. Use them to break the 4th wall (100💎), reveal profile pictures (1💎), or swap your anchor post (10💎).';
  ELSIF p_user_message ILIKE '%coma%' THEN
    v_response := 'COMA status means a user has deactivated their account. You can still message them using the "Break 4th Wall" feature for 100 Talents. They''ll receive your message if they return.';
  ELSIF p_user_message ILIKE '%13%' OR p_user_message ILIKE '%67%' THEN
    v_response := 'The 6713 Rule: Non-connections see your metrics capped at 13+ likes and 67+ huemans. This preserves mystery and value in your profile. Only your connections see the real numbers.';
  ELSIF p_user_message ILIKE '%qt%' OR p_user_message ILIKE '%quality time%' THEN
    v_response := 'QT (Quality Time) tracks how long someone views your profile. When you cut a connection, the Snitch Protocol reveals the total QT to them—even negative values if you viewed them more than they viewed you.';
  ELSE
    v_response := 'I''m Pope AI, your guide to 6713. Ask me about: CPR revival, Talents, COMA status, the 6713 Rule (13+/67+), or QT tracking. How can I help you navigate the protocol?';
  END IF;
  
  -- Insert Pope AI response
  INSERT INTO chat_messages (
    thread_id,
    sender_id,
    is_system_message,
    message_text
  )
  VALUES (
    v_thread_id,
    NULL,
    TRUE,
    v_response
  )
  RETURNING message_id INTO v_message_id;
  
  -- Update thread timestamp
  UPDATE chat_threads
  SET last_message_at = NOW()
  WHERE thread_id = v_thread_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. FUNCTIONS: Nickname Management
-- =====================================================

-- Function: Set Nickname for Thread
CREATE OR REPLACE FUNCTION set_thread_nickname(
  p_thread_id UUID,
  p_user_id UUID,
  p_nickname TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE chat_threads
  SET nickname_for_other = p_nickname
  WHERE thread_id = p_thread_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. RLS POLICIES
-- =====================================================

-- System Accounts: Public read
ALTER TABLE system_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System accounts are viewable by everyone"
  ON system_accounts FOR SELECT
  USING (TRUE);

-- Threads: Users can only see their own threads
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own threads"
  ON chat_threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create threads"
  ON chat_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads"
  ON chat_threads FOR UPDATE
  USING (auth.uid() = user_id);

-- Messages: Users can see messages in their threads
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their threads"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_threads
      WHERE thread_id = chat_messages.thread_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_threads
      WHERE thread_id = chat_messages.thread_id
        AND user_id = auth.uid()
    )
  );

-- Conversation QT: Users can track their own sessions
ALTER TABLE conversation_qt ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own QT sessions"
  ON conversation_qt FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create QT sessions"
  ON conversation_qt FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their QT sessions"
  ON conversation_qt FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- END OF MIGRATION
-- =====================================================
