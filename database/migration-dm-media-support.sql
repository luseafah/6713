-- Add media support to DM messages for identity verification photos
DO $$
BEGIN
  -- Add message_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dm_messages' AND column_name = 'message_type') THEN
    ALTER TABLE dm_messages ADD COLUMN message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice'));
    RAISE NOTICE 'Added message_type column to dm_messages';
  ELSE
    RAISE NOTICE 'message_type column already exists in dm_messages';
  END IF;

  -- Add media_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dm_messages' AND column_name = 'media_url') THEN
    ALTER TABLE dm_messages ADD COLUMN media_url TEXT;
    RAISE NOTICE 'Added media_url column to dm_messages';
  ELSE
    RAISE NOTICE 'media_url column already exists in dm_messages';
  END IF;
END $$;