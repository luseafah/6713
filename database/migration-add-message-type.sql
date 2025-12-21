-- Migration: Add message_type column to wall_messages
-- Run this ONLY if message_type column doesn't exist yet
-- Safe to run multiple times (uses IF NOT EXISTS logic)

DO $$ 
BEGIN
  -- Check if message_type column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wall_messages' 
    AND column_name = 'message_type'
  ) THEN
    -- Add message_type column
    ALTER TABLE wall_messages 
    ADD COLUMN message_type TEXT DEFAULT 'text' 
    CHECK (message_type IN ('text', 'voice', 'picture', 'system'));
    
    RAISE NOTICE 'Added message_type column';
  ELSE
    RAISE NOTICE 'message_type column already exists';
  END IF;
END $$;

-- Verify the column
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'wall_messages'
AND column_name = 'message_type';
