-- Verify HUE setup - Check what columns exist
-- Run this to see the current state of wall_messages table

SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'wall_messages' 
ORDER BY ordinal_position;

-- Check if indexes exist
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'wall_messages' 
ORDER BY indexname;

-- Count existing posts by type
SELECT 
  post_type, 
  COUNT(*) as count 
FROM wall_messages 
GROUP BY post_type;

-- Check for any stories
SELECT 
  id,
  username,
  post_type,
  expires_at,
  created_at,
  CASE 
    WHEN expires_at IS NULL THEN 'No expiry (Wall post)'
    WHEN expires_at > NOW() THEN 'Active story'
    ELSE 'Expired story'
  END as status
FROM wall_messages 
WHERE post_type = 'story' OR post_type IS NULL
ORDER BY created_at DESC 
LIMIT 5;
