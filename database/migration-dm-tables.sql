-- =====================================================
-- DM (Direct Messages) Tables for Pope AI Chat
-- =====================================================
-- Creates the tables needed for the Pope AI direct messaging system
-- Used by the /api/dm/pope-ai route for identity verification and $$$ chat

-- =====================================================
-- 1. DM THREADS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dm_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pope_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_dm_threads_user ON dm_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_threads_pope_ai ON dm_threads(is_pope_ai) WHERE is_pope_ai = TRUE;

-- =====================================================
-- 2. DM MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES dm_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_username TEXT NOT NULL,
  content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice')),
  media_url TEXT,
  is_whisper BOOLEAN DEFAULT FALSE,
  fourth_wall_broken BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add any missing columns (safe for existing tables)
DO $$
BEGIN
  -- Add message_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dm_messages' AND column_name = 'message_type') THEN
    ALTER TABLE dm_messages ADD COLUMN message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice'));
    RAISE NOTICE 'Added message_type column to dm_messages';
  ELSE
    RAISE NOTICE 'message_type column already exists in dm_messages';
  END IF;

  -- Add media_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dm_messages' AND column_name = 'media_url') THEN
    ALTER TABLE dm_messages ADD COLUMN media_url TEXT;
    RAISE NOTICE 'Added media_url column to dm_messages';
  ELSE
    RAISE NOTICE 'media_url column already exists in dm_messages';
  END IF;

  -- Add is_whisper column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dm_messages' AND column_name = 'is_whisper') THEN
    ALTER TABLE dm_messages ADD COLUMN is_whisper BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_whisper column to dm_messages';
  ELSE
    RAISE NOTICE 'is_whisper column already exists in dm_messages';
  END IF;

  -- Add fourth_wall_broken column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dm_messages' AND column_name = 'fourth_wall_broken') THEN
    ALTER TABLE dm_messages ADD COLUMN fourth_wall_broken BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added fourth_wall_broken column to dm_messages';
  ELSE
    RAISE NOTICE 'fourth_wall_broken column already exists in dm_messages';
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_dm_messages_thread ON dm_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender ON dm_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_type ON dm_messages(message_type);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE dm_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- DM Threads: Users can only see their own threads, admins can see all
DROP POLICY IF EXISTS "Users can view their own dm threads" ON dm_threads;
CREATE POLICY "Users can view their own dm threads"
  ON dm_threads FOR SELECT
  USING (auth.uid() = user_id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE);

DROP POLICY IF EXISTS "Users can create their own dm threads" ON dm_threads;
CREATE POLICY "Users can create their own dm threads"
  ON dm_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DM Messages: Users can only see messages in their threads, admins can see all
DROP POLICY IF EXISTS "Users can view messages in their threads" ON dm_messages;
CREATE POLICY "Users can view messages in their threads"
  ON dm_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dm_threads
      WHERE dm_threads.id = dm_messages.thread_id
      AND dm_threads.user_id = auth.uid()
    ) OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE
  );

DROP POLICY IF EXISTS "Users can send messages in their threads" ON dm_messages;
CREATE POLICY "Users can send messages in their threads"
  ON dm_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM dm_threads
      WHERE dm_threads.id = dm_messages.thread_id
      AND dm_threads.user_id = auth.uid()
    )
  );

-- Admins can update any DM message (for moderation)
DROP POLICY IF EXISTS "Admins can update any dm message" ON dm_messages;
CREATE POLICY "Admins can update any dm message"
  ON dm_messages FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE);

-- =====================================================
-- 5. UPDATE TRIGGER FOR THREADS
-- =====================================================

-- Function to update thread updated_at when messages are added
CREATE OR REPLACE FUNCTION update_dm_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE dm_threads
  SET updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update thread timestamp
DROP TRIGGER IF EXISTS trigger_update_dm_thread_updated_at ON dm_messages;
CREATE TRIGGER trigger_update_dm_thread_updated_at
  AFTER INSERT ON dm_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_dm_thread_updated_at();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '✅ DM Tables Created - Pope AI chat system ready!' as status;