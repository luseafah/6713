-- $$$4U Official Protocol Tables

-- Official Announcements (max 10 at a time)
CREATE TABLE official_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  media_url TEXT, -- Optional image/video
  donation_goal INTEGER, -- Target Talent amount (nullable for non-donation posts)
  current_donations INTEGER DEFAULT 0,
  goal_reached BOOLEAN DEFAULT FALSE,
  mentioned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User who needs help
  mentioned_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE
);

-- Donation Transactions
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES official_announcements(id) ON DELETE CASCADE,
  donor_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  donor_username TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_announcements_created ON official_announcements(created_at DESC);
CREATE INDEX idx_announcements_archived ON official_announcements(archived_at) WHERE archived_at IS NULL;
CREATE INDEX idx_donations_announcement ON donations(announcement_id);
CREATE INDEX idx_donations_donor ON donations(donor_user_id);

-- Trigger: Auto-archive when more than 10 announcements
CREATE OR REPLACE FUNCTION archive_old_announcements()
RETURNS TRIGGER AS $$
BEGIN
  -- Archive all but the newest 10 announcements
  UPDATE official_announcements
  SET archived_at = NOW()
  WHERE id NOT IN (
    SELECT id FROM official_announcements
    WHERE archived_at IS NULL
    ORDER BY created_at DESC
    LIMIT 10
  )
  AND archived_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_archive_announcements
AFTER INSERT ON official_announcements
FOR EACH ROW
EXECUTE FUNCTION archive_old_announcements();

-- Trigger: Update donation progress when donation is made
CREATE OR REPLACE FUNCTION update_donation_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current_donations total
  UPDATE official_announcements
  SET 
    current_donations = current_donations + NEW.amount,
    goal_reached = CASE 
      WHEN current_donations + NEW.amount >= donation_goal THEN TRUE
      ELSE FALSE
    END
  WHERE id = NEW.announcement_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_donation_progress
AFTER INSERT ON donations
FOR EACH ROW
EXECUTE FUNCTION update_donation_progress();

-- RLS Policies

-- Announcements: Public read, admin-only write
ALTER TABLE official_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active announcements"
ON official_announcements FOR SELECT
USING (archived_at IS NULL);

CREATE POLICY "Only admins can create announcements"
ON official_announcements FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = TRUE
  )
);

-- Donations: Public read, authenticated write
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read donations"
ON donations FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can donate"
ON donations FOR INSERT
WITH CHECK (auth.uid() = donor_user_id);

-- Enable Realtime for live donation updates
ALTER PUBLICATION supabase_realtime ADD TABLE donations;
