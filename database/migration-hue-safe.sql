-- Safe HUE Migration - Only adds what's missing
-- This version checks for existing columns/indexes before creating

-- 1. Check and add post_type column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wall_messages' 
    AND column_name = 'post_type'
  ) THEN
    ALTER TABLE wall_messages 
    ADD COLUMN post_type TEXT DEFAULT 'wall';
    
    ALTER TABLE wall_messages
    ADD CONSTRAINT wall_messages_post_type_check 
    CHECK (post_type IN ('wall', 'story'));
    
    RAISE NOTICE '✓ Added post_type column';
  ELSE
    RAISE NOTICE '✓ post_type column already exists';
    
    -- Ensure the check constraint exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'wall_messages_post_type_check'
    ) THEN
      ALTER TABLE wall_messages
      ADD CONSTRAINT wall_messages_post_type_check 
      CHECK (post_type IN ('wall', 'story'));
      RAISE NOTICE '✓ Added check constraint for post_type';
    END IF;
  END IF;
END $$;

-- 2. Check and add expires_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wall_messages' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE wall_messages 
    ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✓ Added expires_at column';
  ELSE
    RAISE NOTICE '✓ expires_at column already exists';
  END IF;
END $$;

-- 3. Update existing records to have post_type = 'wall' if NULL
UPDATE wall_messages 
SET post_type = 'wall' 
WHERE post_type IS NULL;

-- 4. Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_wall_messages_post_type 
ON wall_messages(post_type);

CREATE INDEX IF NOT EXISTS idx_wall_messages_expires_at 
ON wall_messages(expires_at) 
WHERE expires_at IS NOT NULL;

-- 5. Final verification
DO $$ 
DECLARE
  post_type_exists BOOLEAN;
  expires_at_exists BOOLEAN;
  index_count INTEGER;
BEGIN
  -- Check columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wall_messages' AND column_name = 'post_type'
  ) INTO post_type_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wall_messages' AND column_name = 'expires_at'
  ) INTO expires_at_exists;
  
  -- Check indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'wall_messages' 
  AND (indexname = 'idx_wall_messages_post_type' 
    OR indexname = 'idx_wall_messages_expires_at');
  
  -- Report status
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'HUE Migration Complete!';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'post_type column: %', CASE WHEN post_type_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE 'expires_at column: %', CASE WHEN expires_at_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE 'Indexes created: %', index_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to use! 🎨';
  RAISE NOTICE '═══════════════════════════════════════';
END $$;
