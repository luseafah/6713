-- Migration: Add media_url column to wall_messages table
-- Date: 2025-12-20
-- Description: Adds media_url column to store Supabase Storage URLs for uploaded media

-- Add media_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wall_messages' 
    AND column_name = 'media_url'
  ) THEN
    ALTER TABLE wall_messages ADD COLUMN media_url TEXT;
    RAISE NOTICE 'Added media_url column to wall_messages table';
  ELSE
    RAISE NOTICE 'media_url column already exists in wall_messages table';
  END IF;
END $$;
