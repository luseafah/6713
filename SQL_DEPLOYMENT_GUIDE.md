# 🗄️ SQL Deployment Guide for Vercel/Supabase

## 📊 What to Expect

You have **25 SQL files** totaling **~160KB** of database setup. Here's the full deployment path:

---

## 🎯 Deployment Strategy (Pick ONE)

### Option A: Fresh Start (Recommended for New Projects)
**Use if:** You're starting from scratch or want a clean database

### Option B: Incremental Migrations
**Use if:** You already have data and want to preserve it

---

## 🚀 OPTION A: Fresh Start (Clean Install)

### Step 1: Run Base Schema
**File:** `database/schema.sql` (22KB)
**What it does:**
- Creates 13 core tables (users, profiles, wall_messages, dm_threads, etc.)
- Enables RLS on all tables
- Sets up Pope/Admin policies
- Creates triggers (auto-admin assignment, COMA refills)
- Adds indexes for performance

**Expected output:**
```
CREATE TABLE
CREATE TABLE
...
ALTER TABLE
CREATE POLICY
...
CREATE TRIGGER
```

**Time:** ~5-10 seconds

---

### Step 2: Run Essential Migrations (In Order)

#### 2.1 Storage Setup
**File:** `database/storage-policies.sql` (1.8KB)
**First:** Create bucket `media` in Supabase Dashboard (Storage → Create bucket)
**Then:** Run this SQL
**What it does:**
- Enables RLS on storage.objects
- Allows public read, authenticated upload
- Users can delete their own files only

**Expected:** 5 policies created

---

#### 2.2 Gig System
**File:** `database/migration-gig-protocol.sql` (6.5KB)
**What it does:**
- Adds `gigs` table for G4U Protocol
- Gig states: available → accepted → in_progress → completed
- RLS policies for gig creation/acceptance

**Expected:** 1 table + 4 policies

---

#### 2.3 Talent Economy
**File:** `database/migration-talent-throwing.sql` (4.4KB)
**What it does:**
- Adds `talent_transactions` table
- Functions: `throw_talents()`, `throw_talents_with_log()`
- Transaction logging for audit trail

**Expected:** 1 table + 2 functions + 1 policy

---

#### 2.4 Search & Completion
**File:** `database/migration-search-protocol.sql` (5.1KB)
**What it does:**
- Adds `gig_completions` table (proof of completion)
- Adds `gig_group_photos` table (connect after completing same gig)
- Functions: `check_gig_completion_requirements()`, `submit_gig_voice()`

**Expected:** 2 tables + 2 functions + 4 policies

---

#### 2.5 Gig Connections
**File:** `database/migration-gig-connections.sql` (4.2KB)
**What it does:**
- Adds `gig_connections` table
- Links users who completed same gigs
- Automatic connection creation

**Expected:** 1 table + 2 policies

---

#### 2.6 Signal Channel (Admin Broadcasts)
**File:** `database/migration-signal-channel.sql` (5.5KB)
**What it does:**
- Adds `signal_posts` table (admin announcements)
- Adds `signal_notifications` table (unread tracking)
- Functions: `create_signal_post()`, `get_unread_signal_count()`, `mark_signal_read()`

**Expected:** 2 tables + 3 functions + 4 policies

---

#### 2.7 Notification Engine
**File:** `database/migration-notification-engine.sql` (9.7KB)
**What it does:**
- Adds `notifications` table
- Types: like, comment, dm, gig_accepted, etc.
- Functions: `create_notification()`, `mark_notification_read()`, `get_unread_count()`

**Expected:** 1 table + 3 functions + 2 policies

---

#### 2.8 Official Protocol ($$$4U)
**File:** `database/migration-official-protocol-safe.sql` (6.1KB)
**What it does:**
- Adds `official_announcements` table (Pope's announcements)
- Adds `donations` table (user contributions)
- RLS policies for admin-only creation

**Expected:** 2 tables + 4 policies

---

#### 2.9 Admin God Mode
**File:** `database/migration-admin-god-mode.sql` (16KB)
**What it does:**
- Adds `talent_transactions` table (if not exists)
- Adds `admin_actions` table (audit log)
- Adds `payment_records` table (Stripe integration)
- Adds `verification_queue` table (blue check requests)
- Functions: `admin_grant_talents()`, `admin_verify_user()`, `admin_ban_user()`

**Expected:** 4 tables + 5+ functions + 8 policies

---

#### 2.10 Artist Pages
**File:** `database/migration-artist-pages.sql` (21KB)
**What it does:**
- Adds `sound_snippets` table (profile audio clips)
- Adds `elite_6_videos` table (top 6 pinned videos)
- Adds `user_favorites` table (bookmarks)
- Adds `anchor_posts` table (pinned posts)
- Adds `watch_history` table (video tracking)
- Adds `activity_log` table (user actions)
- Adds `admin_tickets` table (support system)
- Adds `hashtags` + `post_hashtags` tables

**Expected:** 9 tables + 18+ policies

---

#### 2.11 Dynamic Messaging
**File:** `database/migration-dynamic-messaging.sql` (20KB)
**What it does:**
- Adds `system_messages` table (Pope AI responses)
- Adds `quick_replies` table (suggested replies)
- Functions: `create_system_message()`, `create_quick_replies()`

**Expected:** 2 tables + 2 functions + 4 policies

---

#### 2.12 Comment Ceiling (67+ Auto-Delete)
**File:** `database/migration-comment-ceiling.sql` (6.8KB)
**What it does:**
- Adds FIFO trigger to auto-delete oldest comments when > 67
- Keeps comment threads at max 67 per post

**Expected:** 1 function + 1 trigger

---

### Step 3: Verify Installation

**File:** `database/verify-security.sql` (4KB)

```sql
-- Check all tables have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verify triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Check policy count
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
```

**Expected Output:**
- ✅ ~49 tables with `rowsecurity = true`
- ✅ 3+ triggers
- ✅ 100+ policies

---

## ⚡ OPTION B: Already Have Data?

### If Your Database Already Has Some Tables

Run **only the migrations you're missing**. Check what exists first:

```sql
-- List existing tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check which migrations already ran
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Then run migrations for **missing features**:
- Missing `gigs` table? → Run `migration-gig-protocol.sql`
- Missing `notifications` table? → Run `migration-notification-engine.sql`
- Missing `signal_posts` table? → Run `migration-signal-channel.sql`
- Etc.

---

## 🎬 Quickstart Commands

### For Supabase Dashboard (Web UI)

1. Go to **SQL Editor**
2. Click **"New query"**
3. Copy entire contents of `database/schema.sql`
4. Click **"Run"**
5. Wait for success message (~10 seconds)
6. Repeat for each migration file in order (from 2.1 to 2.12 above)

### For Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Run base schema
supabase db push --file database/schema.sql

# Run migrations (one by one)
supabase db push --file database/storage-policies.sql
supabase db push --file database/migration-gig-protocol.sql
supabase db push --file database/migration-talent-throwing.sql
# ... etc
```

### For Direct psql Connection

```bash
# Get connection string from Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres"

# Then run each file:
\i database/schema.sql
\i database/storage-policies.sql
\i database/migration-gig-protocol.sql
# ... etc
```

---

## 🔍 What Each File Changes

| File | Tables Added | Functions | Policies | Size |
|------|-------------|-----------|----------|------|
| `schema.sql` | 13 core tables | 2 triggers | 50+ | 22KB |
| `storage-policies.sql` | 0 (modifies storage) | 0 | 5 | 1.8KB |
| `migration-gig-protocol.sql` | 1 (gigs) | 0 | 4 | 6.5KB |
| `migration-talent-throwing.sql` | 1 (transactions) | 2 | 1 | 4.4KB |
| `migration-search-protocol.sql` | 2 (completions, photos) | 2 | 4 | 5.1KB |
| `migration-gig-connections.sql` | 1 (connections) | 0 | 2 | 4.2KB |
| `migration-signal-channel.sql` | 2 (signal, notifs) | 3 | 4 | 5.5KB |
| `migration-notification-engine.sql` | 1 (notifications) | 3 | 2 | 9.7KB |
| `migration-official-protocol-safe.sql` | 2 (announcements, donations) | 0 | 4 | 6.1KB |
| `migration-admin-god-mode.sql` | 4 (transactions, actions, payments, verification) | 5+ | 8 | 16KB |
| `migration-artist-pages.sql` | 9 (sounds, videos, favorites, etc.) | 0 | 18+ | 21KB |
| `migration-dynamic-messaging.sql` | 2 (system_messages, quick_replies) | 2 | 4 | 20KB |
| `migration-comment-ceiling.sql` | 0 | 1 trigger | 0 | 6.8KB |
| **TOTAL** | **38 new tables** | **18+ functions** | **106+ policies** | **~160KB** |

---

## ⏱️ Time Estimates

- **Base schema:** 5-10 seconds
- **Each migration:** 2-5 seconds
- **Total time (all migrations):** 3-5 minutes
- **Verification:** 30 seconds

**Total setup time: ~5-10 minutes max**

---

## ⚠️ Common Issues

### Error: "relation already exists"
**Solution:** You already ran this migration. Skip it.

### Error: "function already exists"
**Solution:** Drop the function first:
```sql
DROP FUNCTION IF EXISTS function_name CASCADE;
```
Then re-run the migration.

### Error: "permission denied"
**Solution:** Make sure you're using the Supabase Dashboard SQL Editor or a user with SUPERUSER permissions.

### Error: "cannot create policy"
**Solution:** RLS might not be enabled:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

---

## ✅ Final Checklist

After running all SQL:

- [ ] Run `database/verify-security.sql` to check RLS
- [ ] Create `media` bucket in Storage
- [ ] Verify first user gets admin role (sign up test)
- [ ] Test talent throwing between users
- [ ] Test gig creation/acceptance
- [ ] Check admin dashboard loads
- [ ] Verify notifications work
- [ ] Test DM privacy (can't read others' messages)

---

## 🎯 Recommended Order (Copy-Paste This)

1. ✅ `schema.sql` - BASE (REQUIRED)
2. ✅ `storage-policies.sql` - Media uploads
3. ✅ `migration-gig-protocol.sql` - G4U system
4. ✅ `migration-talent-throwing.sql` - Economy
5. ✅ `migration-search-protocol.sql` - Gig completion
6. ✅ `migration-gig-connections.sql` - User connections
7. ✅ `migration-notification-engine.sql` - Notifications
8. ✅ `migration-signal-channel.sql` - Admin broadcasts
9. ✅ `migration-official-protocol-safe.sql` - $$$4U system
10. ✅ `migration-admin-god-mode.sql` - Admin controls
11. ✅ `migration-artist-pages.sql` - Profile features
12. ✅ `migration-dynamic-messaging.sql` - Pope AI
13. ✅ `migration-comment-ceiling.sql` - FIFO comments

**Skip these (optional/deprecated):**
- ❌ `clean-schema.sql` (alternative to schema.sql)
- ❌ `migration-genesis.sql` (already in schema.sql)
- ❌ `migration-official-protocol.sql` (use -safe version instead)
- ❌ `cleanup-official-protocol.sql` (only for resetting)
- ❌ `create-profiles-supabase.sql` (redundant)
- ❌ `migration-add-*.sql` (already in main migrations)
- ❌ `migration-hue-safe.sql` (already in schema.sql)
- ❌ `migration-ephemeral.sql` (experimental)

---

## 🚀 Deploy to Vercel After SQL Setup

Once SQL is done:

1. Set Vercel environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
   SUPABASE_SERVICE_ROLE_KEY=eyJyyy (secret!)
   ```

2. Update Supabase Auth → URL Configuration:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

3. Deploy and test! 🎉

---

**Questions? Check [RLS_VERCEL_AUDIT.md](./RLS_VERCEL_AUDIT.md) for security verification.**
