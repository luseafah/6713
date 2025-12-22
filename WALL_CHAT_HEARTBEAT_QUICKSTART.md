# Wall Chat Heartbeat - Quick Start Deployment

**Get the living heartbeat system running in 5 minutes.**

---

## Prerequisites

- ✅ Supabase project set up
- ✅ Database URL configured
- ✅ Node.js environment running
- ✅ Admin access to database

---

## Step 1: Run Database Migration (2 minutes)

### Option A: Using psql
```bash
# Connect to your Supabase database
psql $DATABASE_URL

# Run the migration
\i database/migration-wall-chat-heartbeat.sql

# Expected output:
# ============================================================================
# WALL CHAT HEARTBEAT MIGRATION COMPLETE
# ============================================================================
# NEW FEATURES ENABLED:
#   ✓ Admin Slasher moderation (strikethrough)
#   ✓ Story Slider tracking (every 30 messages)
#   ✓ Real-time typing presence (67+ cap)
#   ✓ Online presence tracking (13+ ghost baseline)
# ============================================================================
```

### Option B: Using Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `database/migration-wall-chat-heartbeat.sql`
3. Paste and click "Run"
4. Wait for "Success" message

---

## Step 2: Verify Migration (30 seconds)

### Check Tables Exist
```sql
-- Should return 3 new tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'wall_story_sliders',
    'wall_typing_presence', 
    'wall_online_presence'
  );
```

### Check Functions Exist
```sql
-- Should return 8 functions
SELECT proname FROM pg_proc 
WHERE proname IN (
  'update_online_presence',
  'get_online_count',
  'update_typing_presence',
  'get_typing_count',
  'slash_wall_message',
  'unslash_wall_message',
  'insert_story_slider',
  'cleanup_stale_typing_presence',
  'cleanup_stale_online_presence'
);
```

### Check Columns Added
```sql
-- Should show new slash columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'wall_messages' 
  AND column_name IN (
    'is_slashed',
    'slashed_by',
    'slashed_at',
    'original_content',
    'slash_reason'
  );
```

---

## Step 3: Enable Supabase Realtime (1 minute)

### Via Dashboard
1. Go to Database → Replication
2. Enable realtime for these tables:
   - ✅ `wall_messages` (should already be enabled)
   - ✅ `wall_typing_presence` (new)
   - ✅ `wall_online_presence` (new)
   - ✅ `wall_story_sliders` (new)

### Via SQL
```sql
-- Already in migration, but verify:
ALTER PUBLICATION supabase_realtime 
  ADD TABLE wall_typing_presence,
  ADD TABLE wall_online_presence,
  ADD TABLE wall_story_sliders;
```

---

## Step 4: Deploy Frontend Code (1 minute)

### Rebuild Next.js
```bash
# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Or start dev server for testing
npm run dev
```

### Verify Files Updated
```bash
# Check modified files
git status

# Should show:
# modified:   components/WallChat.tsx
# modified:   types/database.ts
# modified:   WALL_CHAT_GUIDE.md
# new file:   database/migration-wall-chat-heartbeat.sql
# new file:   WALL_CHAT_HEARTBEAT_COMPLETE.md
# new file:   WALL_CHAT_HEARTBEAT_VISUAL_REFERENCE.md
```

---

## Step 5: Test Features (5 minutes)

### Test 1: Online Presence (30s)
1. Open Wall Chat in browser
2. Look at top right header
3. Should see: **"13+ Online"** with green pulse
4. Open another browser window
5. Count should increase (if >13 real users)

**Expected:** ✅ Always shows minimum 13+

---

### Test 2: Typing Indicator (30s)
1. Start typing in the input field
2. Look above input area (bottom of screen)
3. Should see: **"● ● ● 1 person typing..."**
4. Open another window and type there too
5. Should update to: **"2 people typing..."**

**Expected:** ✅ Caps at "67+ people typing..."

---

### Test 3: Story Slider (2 minutes)

#### Setup Test Stories
```sql
-- Create test verified user
UPDATE users SET is_verified = TRUE 
WHERE email = 'test@example.com';

-- Add test stories
INSERT INTO wall_messages (user_id, username, content, post_type, media_url)
SELECT 
  id,
  username,
  'Test Story ' || generate_series(1, 5),
  'story',
  'https://picsum.photos/400/700?random=' || generate_series(1, 5)
FROM users 
WHERE is_verified = TRUE 
LIMIT 1;
```

#### Test Slider Appearance
1. Send 30 messages in Wall Chat
2. After 30th message, slider should appear
3. Should show 3 random verified user stories
4. Test navigation:
   - Click left/right arrows
   - Check dot indicators update
   - Click X to close

**Expected:** ✅ Slider appears at 30, 60, 90 messages

---

### Test 4: Admin Slasher (1 minute)

#### Make Yourself Admin
```sql
UPDATE users SET is_admin = TRUE 
WHERE email = 'your@email.com';
```

#### Test Slash Action
1. Refresh Wall Chat
2. Hover over any message
3. Red slash button should appear (admin only)
4. Click slash button
5. Message should:
   - Strike through
   - Turn slate grey
   - Show "~~Slashed by moderator~~"

**Expected:** ✅ Message slashed with strikethrough

---

### Test 5: 50-Message Auto-Purge (1 minute)
1. Send 51 messages in Wall Chat
2. Scroll to top
3. First message should be gone
4. Only last 50 should be visible

**Expected:** ✅ Auto-purge at 51st message

---

## Troubleshooting

### Issue: "13+ Online" not showing
**Solution:**
```sql
-- Check if function exists
SELECT get_online_count();

-- Manually trigger presence
SELECT update_online_presence(
  (SELECT id FROM users LIMIT 1),
  'test_user'
);

-- Check table
SELECT * FROM wall_online_presence;
```

---

### Issue: Typing indicator not appearing
**Solution:**
```sql
-- Check if table exists
SELECT * FROM wall_typing_presence;

-- Check Realtime is enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

---

### Issue: Story Slider not appearing
**Solution:**
```sql
-- Check for verified users with stories
SELECT COUNT(*) FROM wall_messages 
WHERE post_type = 'story' 
  AND expires_at > NOW()
  AND user_id IN (SELECT id FROM users WHERE is_verified = TRUE);

-- Should return at least 3
-- If not, create test stories (see Test 3 above)
```

---

### Issue: Slash button not visible
**Solution:**
```sql
-- Verify you are admin
SELECT is_admin FROM users WHERE email = 'your@email.com';

-- Should return TRUE
-- If not, run:
UPDATE users SET is_admin = TRUE WHERE email = 'your@email.com';
```

---

## Production Deployment Checklist

Before deploying to production:

### Database
- [ ] Migration run successfully
- [ ] All 3 tables created
- [ ] All 8 functions created
- [ ] RLS policies enabled
- [ ] Realtime enabled for all tables
- [ ] At least 3 verified users with active stories exist

### Frontend
- [ ] `npm run build` succeeds without errors
- [ ] No TypeScript errors in WallChat.tsx
- [ ] No console errors in browser
- [ ] All 5 features tested and working

### Performance
- [ ] Realtime connections stable
- [ ] Typing presence updates smoothly
- [ ] Story slider loads without lag
- [ ] Auto-purge doesn't cause UI flicker

### Security
- [ ] Only admins can slash messages
- [ ] RLS policies prevent unauthorized access
- [ ] Original content preserved in audit trail
- [ ] No sensitive data exposed in presence tables

---

## Rollback Plan

If something goes wrong:

### Option 1: Rollback Migration
```sql
-- Drop new tables
DROP TABLE IF EXISTS wall_story_sliders CASCADE;
DROP TABLE IF EXISTS wall_typing_presence CASCADE;
DROP TABLE IF EXISTS wall_online_presence CASCADE;

-- Drop new columns
ALTER TABLE wall_messages 
  DROP COLUMN IF EXISTS is_slashed,
  DROP COLUMN IF EXISTS slashed_by,
  DROP COLUMN IF EXISTS slashed_at,
  DROP COLUMN IF EXISTS original_content,
  DROP COLUMN IF EXISTS slash_reason;

-- Drop functions
DROP FUNCTION IF EXISTS update_online_presence CASCADE;
DROP FUNCTION IF EXISTS get_online_count CASCADE;
DROP FUNCTION IF EXISTS update_typing_presence CASCADE;
DROP FUNCTION IF EXISTS remove_typing_presence CASCADE;
DROP FUNCTION IF EXISTS get_typing_count CASCADE;
DROP FUNCTION IF EXISTS cleanup_stale_typing_presence CASCADE;
DROP FUNCTION IF EXISTS cleanup_stale_online_presence CASCADE;
DROP FUNCTION IF EXISTS slash_wall_message CASCADE;
DROP FUNCTION IF EXISTS unslash_wall_message CASCADE;
DROP FUNCTION IF EXISTS insert_story_slider CASCADE;
```

### Option 2: Rollback Frontend
```bash
# Revert to previous version of WallChat.tsx
git checkout HEAD~1 -- components/WallChat.tsx types/database.ts

# Rebuild
npm run build

# Redeploy
```

---

## Performance Monitoring

### Database Queries to Monitor

#### Check Presence Table Sizes
```sql
SELECT 
  'online_presence' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('wall_online_presence')) as size
FROM wall_online_presence
UNION ALL
SELECT 
  'typing_presence',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('wall_typing_presence'))
FROM wall_typing_presence;
```

#### Check Story Slider Usage
```sql
SELECT 
  COUNT(*) as total_sliders,
  MAX(slider_position) as max_position,
  COUNT(*) * 3 as stories_shown
FROM wall_story_sliders
WHERE created_at > NOW() - INTERVAL '24 hours';
```

#### Check Slash Activity
```sql
SELECT 
  COUNT(*) as total_slashed,
  COUNT(DISTINCT slashed_by) as unique_mods,
  DATE_TRUNC('hour', slashed_at) as hour,
  COUNT(*) as slashes_per_hour
FROM wall_messages
WHERE is_slashed = TRUE
GROUP BY DATE_TRUNC('hour', slashed_at)
ORDER BY hour DESC
LIMIT 24;
```

---

## Support & Documentation

### Quick Links
- [WALL_CHAT_GUIDE.md](WALL_CHAT_GUIDE.md) - Complete feature guide
- [WALL_CHAT_HEARTBEAT_COMPLETE.md](WALL_CHAT_HEARTBEAT_COMPLETE.md) - Implementation details
- [WALL_CHAT_HEARTBEAT_VISUAL_REFERENCE.md](WALL_CHAT_HEARTBEAT_VISUAL_REFERENCE.md) - Design specs

### Database Schema Reference
```sql
-- View all heartbeat tables
\dt wall_*

-- View all heartbeat functions
\df *presence* \df *slider* \df *slash*
```

---

## Success Criteria

You'll know the system is working when:

✅ **Online Presence**
- Header always shows "13+ Online"
- Count updates in real-time
- Green pulse animation is smooth

✅ **Typing Presence**
- "X people typing..." appears when users type
- Caps at "67+ people typing..."
- Dot animation is smooth and staggered

✅ **Story Slider**
- Appears at 30, 60, 90 message intervals
- Shows 3 random verified user stories
- Navigation works smoothly
- Close button dismisses slider

✅ **Admin Slasher**
- Slash button only visible to admins
- Slashed messages show strikethrough
- Original content preserved
- Grey text color applied

✅ **Auto-Purge**
- Only 50 messages in buffer
- 51st message triggers deletion
- No performance degradation

---

**Deployment Time:** ~5 minutes  
**Difficulty:** Easy  
**Status:** Production-Ready ✅

**Questions?** Check [WALL_CHAT_GUIDE.md](WALL_CHAT_GUIDE.md) for troubleshooting.
