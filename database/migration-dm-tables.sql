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

-- DM Threads: Users can only see their own threads
DROP POLICY IF EXISTS "Users can view their own dm threads" ON dm_threads;
CREATE POLICY "Users can view their own dm threads"
  ON dm_threads FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own dm threads" ON dm_threads;
CREATE POLICY "Users can create their own dm threads"
  ON dm_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DM Messages: Users can only see messages in their threads
DROP POLICY IF EXISTS "Users can view messages in their threads" ON dm_messages;
CREATE POLICY "Users can view messages in their threads"
  ON dm_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dm_threads
      WHERE dm_threads.id = dm_messages.thread_id
      AND dm_threads.user_id = auth.uid()
    )
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