-- Cleanup script for Official Protocol tables
-- Run this ONLY if you need to reset the $$$4U system

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_update_donation_progress ON donations;
DROP TRIGGER IF EXISTS trigger_archive_announcements ON official_announcements;

-- Drop functions
DROP FUNCTION IF EXISTS update_donation_progress();
DROP FUNCTION IF EXISTS archive_old_announcements();

-- Drop tables (CASCADE removes all dependencies)
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS official_announcements CASCADE;

-- Note: Run migration-official-protocol.sql after this to recreate fresh
