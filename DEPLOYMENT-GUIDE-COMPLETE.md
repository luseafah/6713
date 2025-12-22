# 🚀 6713 COMPLETE REBUILD & DEPLOYMENT GUIDE

## ⚠️ CRITICAL ISSUES FIXED

Your app had **fundamental database schema errors** where all migrations referenced a `users` table that doesn't exist in Supabase. Everything has been rebuilt to work correctly with:
- `auth.users` (Supabase managed authentication)
- `profiles` (custom table linked to auth.users)

---

## 📋 DEPLOYMENT ORDER (Run in Supabase SQL Editor)

### 1. **MASTER INITIALIZATION** (Run First)
**File:** `database/INIT-MASTER-SCHEMA.sql`

Creates:
- `profiles` table (links to auth.users)
- Auto-signup trigger
- `wall_messages` table
- `wall_reactions` table
- `talent_transactions` table
- `system_settings` table
- Helper functions (`get_username`, `is_admin`, `throw_talents`)

**Status:** ✅ Ready to deploy

---

### 2. **WALL CHAT HEARTBEAT** (Run Second)
**File:** `database/migration-wall-chat-heartbeat.sql`

Creates:
- Slash moderation columns
- `wall_story_sliders` table
- `wall_typing_presence` table (67+ cap)
- `wall_online_presence` table (13+ baseline)
- Functions: `slash_wall_message`, `get_typing_count`, `get_online_count`

**Fixes Applied:**
- ✅ Changed all `REFERENCES users(id)` → `REFERENCES auth.users(id)`
- ✅ Changed admin checks from `users.is_admin` → `profiles.is_admin`
- ✅ Changed verified check from `users.is_verified` → `profiles.verified_at IS NOT NULL`

**Status:** ✅ Ready to deploy

---

### 3. **HAMBURGER SEARCH** (Run Third)
**File:** `database/migration-hamburger-search.sql`

Creates:
- `search_history` table (10 recent searches)
- `volatile_tags` table (Elite 6 trending)
- `slashed_tags` table (admin tag gardening)
- Search functions for humans/sounds/gigs/tags

**Fixes Applied:**
- ✅ Changed all `REFERENCES users(id)` → `REFERENCES auth.users(id)`
- ✅ Changed admin checks from `users.role='admin'` → `profiles.is_admin=TRUE`
- ✅ Rewritten search functions to query `profiles` instead of `users`
- ✅ Use `get_username()` helper function for auth.users metadata

**Status:** ⚠️ PARTIALLY FIXED - needs complete search function rewrite (see below)

---

### 4. **PROFILE PAGE** (Run Fourth)
**File:** `database/migration-profile-page.sql`

Creates:
- `anchor_posts` table (1 permanent photo)
- `pinned_content` table (3+3 media slots)
- `profile_visits` table (QT tracking)
- `cpr_counters` table (revival tracking)
- `fourth_wall_breaks` table (COMA messaging)
- `connection_cuts` table (Snitch Alert)

**Status:** ✅ Already correct - uses `auth.users(id)` foreign keys

---

### 5. **PULSE CHAT** (Run Fifth)
**File:** `database/migration-pulse-chat.sql`

Creates:
- `chat_threads` table (1-on-1 + $$$ chats)
- `chat_messages` table
- `conversation_qt` table (dwell time tracking)
- Pope AI chat functions

**Status:** ✅ Already correct - uses `auth.users(id)` foreign keys

---

## 🛠️ REMAINING FIXES NEEDED

### HAMBURGER SEARCH FUNCTIONS

Three search functions still have issues querying non-existent tables:

1. **`search_sounds()` function** (line ~300-330)
   - Queries: `sounds` table, `users` table
   - Fix: Check if `sounds` table exists, use `profiles` + `get_username()`

2. **`search_gigs()` function** (line ~345-380)
   - Queries: `gigs` table, `users` table
   - Fix: Check if `gigs` table exists, use `profiles` + `get_username()`

3. **Admin hidden search** (lines ~420-445)
   - Checks: `users` table role
   - Fix: Check `profiles.is_admin`

---

## 🎨 FRONTEND FIXES APPLIED

### Components Fixed ✅
- **WallChat.tsx** - Now queries `profiles` table, gets username from `user.user_metadata`
- **Money page** - Queries `profiles.talent_balance`
- **Settings page** - Queries `profiles.talent_balance`
- **UploadModal** - Queries `profiles`
- **RedXUploadButton** - Queries `profiles`
- **ActivityLog** - Queries `profiles`

### Components Still Broken 🔴
- **Profile Page** (`app/profile/[username]/page.tsx`)
  - **Line 172:** Queries non-existent `users` table
  - **Fix needed:** Lookup username via `auth.users.raw_user_meta_data->>'username'`, then query `profiles`

---

## 📝 DEPLOYMENT STEPS

### Step 1: Backup Current Data
```sql
-- In Supabase SQL Editor
-- Export any existing data you want to keep
```

### Step 2: Drop Existing Tables (if needed)
```sql
-- Only if you have broken tables from previous deploys
DROP TABLE IF EXISTS wall_typing_presence CASCADE;
DROP TABLE IF EXISTS wall_online_presence CASCADE;
DROP TABLE IF EXISTS wall_story_sliders CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS volatile_tags CASCADE;
DROP TABLE IF EXISTS slashed_tags CASCADE;
DROP TABLE IF EXISTS anchor_posts CASCADE;
DROP TABLE IF EXISTS pinned_content CASCADE;
DROP TABLE IF EXISTS profile_visits CASCADE;
DROP TABLE IF EXISTS cpr_counters CASCADE;
DROP TABLE IF EXISTS fourth_wall_breaks CASCADE;
DROP TABLE IF EXISTS connection_cuts CASCADE;
DROP TABLE IF EXISTS chat_threads CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS conversation_qt CASCADE;
DROP TABLE IF EXISTS wall_reactions CASCADE;
DROP TABLE IF EXISTS wall_messages CASCADE;
DROP TABLE IF EXISTS talent_transactions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

### Step 3: Run Migrations in Order
1. Open Supabase Dashboard → SQL Editor
2. Run `INIT-MASTER-SCHEMA.sql` ✅
3. Wait for success message
4. Run `migration-wall-chat-heartbeat.sql` ✅
5. Run `migration-hamburger-search.sql` ⚠️
6. Run `migration-profile-page.sql` ✅
7. Run `migration-pulse-chat.sql` ✅

### Step 4: Verify Setup
```sql
-- Check profiles table exists and has trigger
SELECT * FROM profiles LIMIT 1;

-- Check wall_messages table
SELECT * FROM wall_messages LIMIT 1;

-- Test helper functions
SELECT get_username('your-user-id-here');
SELECT is_admin('your-user-id-here');
```

### Step 5: Test Sign Up Flow
1. Go to your app (locally or on Vercel)
2. Sign up with test account
3. Verify profile is auto-created in `profiles` table
4. Check username is stored in `auth.users.raw_user_meta_data`

---

## 🐛 KNOWN ISSUES & TODO

### High Priority 🔴
1. **Profile Page Component** - Fix username lookup (line 172)
2. **Hamburger Search** - Complete rewrite of search functions to use correct tables
3. **Username Storage** - Ensure consistent use of `auth.users.raw_user_meta_data->>'username'`

### Medium Priority 🟡
1. **Sounds Table** - Not created yet, search_sounds() will fail
2. **Gigs Table** - Not created yet, search_gigs() will fail
3. **Connections Table** - Referenced in profile stats but not created

### Low Priority 🟢
1. **Admin Actions** - Test slash/unslash message functions
2. **Story Slider** - Test 30-message trigger
3. **QT Tracking** - Verify dwell time calculations

---

## 🧪 TESTING CHECKLIST

After deployment, test these flows:

### Authentication ✅
- [ ] Sign up new account
- [ ] Login existing account
- [ ] Profile auto-created in profiles table
- [ ] Username stored in metadata

### Wall Chat ✅
- [ ] Post text message
- [ ] Post with media
- [ ] Reply to message
- [ ] Throw Talents
- [ ] Slowmode works (7s cooldown)
- [ ] Skip slowmode for 5 Talents

### Search 🔴
- [ ] Search for users (broken until rewrite)
- [ ] Search history saves
- [ ] Trending tags display

### Profile Page 🔴
- [ ] View own profile (broken until line 172 fix)
- [ ] View other profiles
- [ ] Anchor post displays
- [ ] Pinned content displays

### Admin Functions ⚠️
- [ ] Slash message works
- [ ] Slash tag works
- [ ] Admin panel access

---

## 📞 SUPPORT

If you encounter errors during deployment:

1. **Check error message** - Most errors tell you exactly what's wrong
2. **Foreign key errors** - Make sure parent tables are created first
3. **"relation does not exist"** - Table name typo or migration not run
4. **RLS policy errors** - Check if policies reference correct tables

---

## 🎯 NEXT STEPS

1. **Deploy master schema** ✅
2. **Deploy 4 migrations** ✅ (with notes on remaining issues)
3. **Fix Profile Page component** 🔴
4. **Rewrite search functions** 🔴
5. **Test full app flow** ⏳
6. **Deploy to Vercel** ⏳

---

**Generated:** December 22, 2025  
**Status:** Core migrations ready, frontend partially fixed, search needs rewrite
