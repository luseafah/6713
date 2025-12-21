-- Migration: Add story support to wall_messages
-- Date: 2025-12-20
-- Description: Adds post_type and expires_at columns for story functionality

-- Add post_type column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wall_messages' 
    AND column_name = 'post_type'
  ) THEN
    ALTER TABLE wall_messages 
    ADD COLUMN post_type TEXT DEFAULT 'wall' 
    CHECK (post_type IN ('wall', 'story'));
    RAISE NOTICE 'Added post_type column to wall_messages table';
  ELSE
    RAISE NOTICE 'post_type column already exists in wall_messages table';
  END IF;
END $$;

-- Add expires_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wall_messages' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE wall_messages ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added expires_at column to wall_messages table';
  ELSE
    RAISE NOTICE 'expires_at column already exists in wall_messages table';
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_wall_messages_post_type ON wall_messages(post_type);
CREATE INDEX IF NOT EXISTS idx_wall_messages_expires_at ON wall_messages(expires_at) WHERE expires_at IS NOT NULL;

-- Update existing records to have post_type = 'wall'
UPDATE wall_messages SET post_type = 'wall' WHERE post_type IS NULL;

RAISE NOTICE 'Migration complete! Stories support added.';
