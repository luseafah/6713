-- 6713 Genesis Build - Database Migration
-- Run this SQL in your Supabase SQL Editor to add Genesis Build features
-- to an existing 6713 database

-- ============================================================================
-- 1. UPDATE SYSTEM SETTINGS
-- ============================================================================

-- Rename glaze_protocol_active to glaze_active
UPDATE system_settings 
SET setting_key = 'glaze_active' 
WHERE setting_key = 'glaze_protocol_active';

-- Insert if not exists
INSERT INTO system_settings (setting_key, setting_value) 
VALUES ('glaze_active', false)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 2. CREATE NEW TABLES
-- ============================================================================

-- CPR Log for tracking shrine link reveals (view once)
CREATE TABLE IF NOT EXISTS cpr_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghost_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rescuer_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  batch_number INTEGER NOT NULL,
  shrine_link_viewed BOOLEAN DEFAULT FALSE,
  shrine_link_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ghost_user_id, rescuer_user_id, batch_number)
);

-- Break 4th Wall transactions (COMA whisper responses)
CREATE TABLE IF NOT EXISTS fourth_wall_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coma_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  requester_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Admin overrides for post stats (13+ rigging)
CREATE TABLE IF NOT EXISTS admin_post_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE UNIQUE,
  override_like_count TEXT DEFAULT '13+',
  overridden_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cpr_log_ghost ON cpr_log(ghost_user_id);
CREATE INDEX IF NOT EXISTS idx_cpr_log_rescuer ON cpr_log(rescuer_user_id);
CREATE INDEX IF NOT EXISTS idx_fourth_wall_breaks_coma ON fourth_wall_breaks(coma_user_id);
CREATE INDEX IF NOT EXISTS idx_fourth_wall_breaks_requester ON fourth_wall_breaks(requester_user_id);

-- ============================================================================
-- 4. MIGRATE EXISTING CPR DATA (Optional)
-- ============================================================================

-- Migrate existing cpr_rescues to cpr_log (batch 0)
-- Only run this if you have existing CPR data to preserve
INSERT INTO cpr_log (ghost_user_id, rescuer_user_id, batch_number, created_at)
SELECT 
  ghost_user_id, 
  rescuer_user_id, 
  0 as batch_number,
  created_at
FROM cpr_rescues
ON CONFLICT (ghost_user_id, rescuer_user_id, batch_number) DO NOTHING;

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Check that all new tables exist
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('cpr_log', 'fourth_wall_breaks', 'admin_post_overrides')
ORDER BY table_name;

-- Verify system settings
SELECT * FROM system_settings WHERE setting_key = 'glaze_active';

-- Check indexes
SELECT 
  indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE '%cpr_log%' 
   OR indexname LIKE '%fourth_wall%'
ORDER BY indexname;

-- ============================================================================
-- 6. POST-MIGRATION NOTES
-- ============================================================================

/*
After running this migration:

1. Verify all tables were created successfully
2. Check that indexes were added
3. Test CPR batch system with new data
4. Verify glaze_active setting exists
5. Test admin_post_overrides table

To rollback (if needed):
  DROP TABLE IF EXISTS cpr_log CASCADE;
  DROP TABLE IF EXISTS fourth_wall_breaks CASCADE;
  DROP TABLE IF EXISTS admin_post_overrides CASCADE;
  UPDATE system_settings SET setting_key = 'glaze_protocol_active' WHERE setting_key = 'glaze_active';

Genesis Build Features Added:
  ✨ Glaze Protocol (Admin God-Mode)
  🔮 13th Revelation (CPR Batch System)
  💀 Void & Shrine Agency (72h Lockout)
  🚫 Whisper Gating (Break 4th Wall)

For full documentation, see:
  - GENESIS_BUILD_SUMMARY.md
  - GENESIS_CHECKLIST.md
  - GENESIS_README.md
*/
