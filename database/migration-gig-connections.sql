-- Gig Connections Table
-- Tracks users who worked together on gigs (for social discovery)

CREATE TABLE IF NOT EXISTS gig_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE NOT NULL,
  poster_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  worker_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gig_title TEXT NOT NULL,
  talent_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_connections_poster ON gig_connections(poster_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_worker ON gig_connections(worker_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_gig ON gig_connections(gig_id);
CREATE INDEX IF NOT EXISTS idx_connections_created ON gig_connections(created_at DESC);

-- RLS Policies
ALTER TABLE gig_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read connections" ON gig_connections;
CREATE POLICY "Anyone can read connections"
ON gig_connections FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can create connections for their gigs" ON gig_connections;
CREATE POLICY "Users can create connections for their gigs"
ON gig_connections FOR INSERT
WITH CHECK (auth.uid() = poster_user_id);

-- Function: Get involvement count for a user (total connections as poster or worker)
CREATE OR REPLACE FUNCTION get_involvement_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  involvement_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO involvement_count
  FROM gig_connections
  WHERE poster_user_id = user_uuid OR worker_user_id = user_uuid;
  
  RETURN involvement_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get recent connections for a user (last 3)
CREATE OR REPLACE FUNCTION get_recent_connections(user_uuid UUID)
RETURNS TABLE (
  connection_user_id UUID,
  connection_user_name TEXT,
  connection_profile_photo TEXT,
  connection_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    CASE 
      WHEN gc.poster_user_id = user_uuid THEN gc.worker_user_id
      ELSE gc.poster_user_id
    END as connection_user_id,
    p.display_name as connection_user_name,
    p.profile_photo as connection_profile_photo,
    gc.created_at as connection_date
  FROM gig_connections gc
  JOIN profiles p ON (
    CASE 
      WHEN gc.poster_user_id = user_uuid THEN gc.worker_user_id
      ELSE gc.poster_user_id
    END = p.id
  )
  WHERE gc.poster_user_id = user_uuid OR gc.worker_user_id = user_uuid
  ORDER BY gc.created_at DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get random connection for discovery
CREATE OR REPLACE FUNCTION get_random_connection(user_uuid UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  profile_photo TEXT,
  gig_stars INTEGER,
  follower_count INTEGER,
  latest_post_expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.display_name,
    p.profile_photo,
    p.gig_stars,
    (SELECT COUNT(*) FROM follows WHERE followed_user_id = p.id) as follower_count,
    (SELECT MAX(expires_at) FROM wall_messages WHERE user_id = p.id AND post_type = 'wall' AND expires_at > NOW()) as latest_post_expires_at
  FROM profiles p
  WHERE p.id IN (
    SELECT CASE 
      WHEN gc.poster_user_id = user_uuid THEN gc.worker_user_id
      ELSE gc.poster_user_id
    END
    FROM gig_connections gc
    WHERE gc.poster_user_id = user_uuid OR gc.worker_user_id = user_uuid
  )
  AND p.id != user_uuid
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add gig_stars to profiles if missing (rating system for gig quality)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gig_stars'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gig_stars INTEGER DEFAULT 0 CHECK (gig_stars >= 0 AND gig_stars <= 5);
  END IF;
END $$;

-- Enable Realtime for connection updates
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE gig_connections;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication
END $$;
