-- Two-Name Protocol & Pope AI Gig-Close System
-- Adds verified_name for Search/Radio and gig completion tracking

-- Add verified_name column to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'verified_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verified_name TEXT;
    RAISE NOTICE 'Added verified_name column to profiles table';
  ELSE
    RAISE NOTICE 'verified_name column already exists in profiles table';
  END IF;
END $$;

-- Gig Completion Tracking Table
CREATE TABLE IF NOT EXISTS gig_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voice_note_url TEXT, -- 3-second voice note (one word)
  voice_submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gig_id, user_id) -- Each user submits once per gig
);

-- Group Photo for Completed Gigs
CREATE TABLE IF NOT EXISTS gig_group_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE NOT NULL UNIQUE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gig_completions_gig ON gig_completions(gig_id);
CREATE INDEX IF NOT EXISTS idx_gig_completions_user ON gig_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_gig_group_photos_gig ON gig_group_photos(gig_id);

-- RLS Policies
ALTER TABLE gig_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_group_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can read completion records for completed Gigs
DROP POLICY IF EXISTS "Anyone can read gig completions" ON gig_completions;
CREATE POLICY "Anyone can read gig completions"
ON gig_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM gigs 
    WHERE gigs.id = gig_id 
    AND gigs.is_completed = TRUE
  )
);

-- Users can submit their own completion proof
DROP POLICY IF EXISTS "Users can submit completion proof" ON gig_completions;
CREATE POLICY "Users can submit completion proof"
ON gig_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Anyone can read group photos
DROP POLICY IF EXISTS "Anyone can read group photos" ON gig_group_photos;
CREATE POLICY "Anyone can read group photos"
ON gig_group_photos FOR SELECT
USING (TRUE);

-- Anyone can upload group photo for a gig they participated in
DROP POLICY IF EXISTS "Participants can upload group photo" ON gig_group_photos;
CREATE POLICY "Participants can upload group photo"
ON gig_group_photos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM gig_completions
    WHERE gig_id = gig_group_photos.gig_id
    AND user_id = auth.uid()
  )
);

-- Function: Check if Gig completion requirements are met
CREATE OR REPLACE FUNCTION check_gig_completion_requirements(gig_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  total_participants INTEGER;
  voice_submissions INTEGER;
  has_group_photo BOOLEAN;
  all_requirements_met BOOLEAN;
BEGIN
  -- Count total participants
  SELECT COUNT(*) INTO total_participants
  FROM gig_completions
  WHERE gig_id = gig_uuid;
  
  -- Count voice note submissions
  SELECT COUNT(*) INTO voice_submissions
  FROM gig_completions
  WHERE gig_id = gig_uuid
  AND voice_note_url IS NOT NULL;
  
  -- Check for group photo
  SELECT EXISTS (
    SELECT 1 FROM gig_group_photos
    WHERE gig_id = gig_uuid
  ) INTO has_group_photo;
  
  -- Requirements: All participants must have voice notes AND one group photo
  all_requirements_met := (voice_submissions = total_participants) AND has_group_photo;
  
  RETURN jsonb_build_object(
    'total_participants', total_participants,
    'voice_submissions', voice_submissions,
    'has_group_photo', has_group_photo,
    'requirements_met', all_requirements_met,
    'missing_voices', total_participants - voice_submissions
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Submit voice note for gig completion
CREATE OR REPLACE FUNCTION submit_gig_voice(
  gig_uuid UUID,
  voice_url TEXT
)
RETURNS JSONB AS $$
DECLARE
  user_uuid UUID;
BEGIN
  user_uuid := auth.uid();
  
  -- Check if user is part of this gig completion
  IF NOT EXISTS (
    SELECT 1 FROM gig_completions
    WHERE gig_id = gig_uuid
    AND user_id = user_uuid
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You are not a participant in this Gig.'
    );
  END IF;
  
  -- Update voice note
  UPDATE gig_completions
  SET voice_note_url = voice_url,
      voice_submitted_at = NOW()
  WHERE gig_id = gig_uuid
  AND user_id = user_uuid;
  
  -- Check if all requirements are now met
  RETURN jsonb_build_object(
    'success', true,
    'requirements', check_gig_completion_requirements(gig_uuid)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_gig_completion_requirements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_gig_voice(UUID, TEXT) TO authenticated;
