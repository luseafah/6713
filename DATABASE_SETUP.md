# 🗄️ Database Setup Guide

## Clean Installation

### 1. Delete Old Tables in Supabase

Go to Supabase Dashboard → SQL Editor → Run this:

```sql
-- Clean slate - removes all old tables
DROP TABLE IF EXISTS admin_post_overrides CASCADE;
DROP TABLE IF EXISTS fourth_wall_breaks CASCADE;
DROP TABLE IF EXISTS cpr_log CASCADE;
DROP TABLE IF EXISTS post_cooldowns CASCADE;
DROP TABLE IF EXISTS wall_reactions CASCADE;
DROP TABLE IF EXISTS dm_messages CASCADE;
DROP TABLE IF EXISTS dm_threads CASCADE;
DROP TABLE IF EXISTS cpr_rescues CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS wall_messages CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

### 2. Run Clean Schema

Copy entire contents of `database/clean-schema.sql` and run in Supabase SQL Editor.

This will create:
- ✅ All 14 tables with proper relationships
- ✅ Indexes for performance
- ✅ Row Level Security policies
- ✅ Pope Trigger (first user becomes admin)
- ✅ COMA refill regeneration
- ✅ Supabase Auth integration

### 3. Verify Tables Created

Check Supabase Dashboard → Table Editor:

**Core Tables:**
- `users` - Basic user info (linked to auth.users)
- `profiles` - Extended user data (admin, COMA, talents, shrine)
- `system_settings` - Global configs (Glaze Protocol)

**Wall System:**
- `wall_messages` - Posts
- `comments` - Post comments (67+ cap)
- `wall_reactions` - Likes (13+ cap)
- `post_cooldowns` - 7-second slow mode
- `admin_post_overrides` - Admin rigged stats

**CPR System:**
- `cpr_rescues` - Who gave CPR
- `cpr_log` - Batch tracking for shrine reveals

**DM System:**
- `dm_threads` - Conversation threads
- `dm_messages` - Messages (whispers, Pope AI)
- `fourth_wall_breaks` - COMA reply requests

---

## Key Changes from Old Schema

### ✅ Fixed Issues:
1. **Auth Integration**: Users now properly reference `auth.users(id)`
2. **Verification**: Changed from `is_verified` boolean to `verified_at` timestamp
3. **Admin Status**: Moved from `users.role` to `profiles.is_admin`
4. **RLS Policies**: Added comprehensive row-level security
5. **Indexes**: Added missing indexes for performance

### ✅ Removed:
- ❌ `users.is_verified` → Now `profiles.verified_at`
- ❌ `users.role` → Now `profiles.is_admin`
- ❌ Duplicate triggers

### ✅ Added:
- ✅ Row Level Security on all tables
- ✅ Proper Supabase Auth integration
- ✅ Better indexes
- ✅ Grant statements for authenticated users

---

## Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: Supabase Dashboard → Project Settings → API

---

## Testing the Setup

### 1. First User (Pope Trigger)
```bash
# Start app
npm run dev

# Go to login screen
# Create first account

# Check Supabase:
# profiles table → first user should have is_admin = true
```

### 2. Verify Tables Work
```sql
-- In Supabase SQL Editor:
SELECT * FROM profiles;
SELECT * FROM system_settings;
SELECT * FROM wall_messages;
```

### 3. Test Auth Flow
- ✅ Create account
- ✅ Login
- ✅ Logout
- ✅ First user is admin
- ✅ Profile created automatically

---

## Row Level Security (RLS)

All tables are secured:

- **Users/Profiles**: Can view all, edit own
- **Wall**: Can view all, create/delete own
- **Comments/Reactions**: Can view all, create own
- **DMs**: Can only view/create in own threads

Admin permissions handled in API routes, not RLS.

---

## Migration Checklist

- [ ] Backup old database (if needed)
- [ ] Run DROP statements to clean tables
- [ ] Run `database/clean-schema.sql`
- [ ] Verify all 14 tables exist
- [ ] Check triggers and functions created
- [ ] Test RLS policies work
- [ ] Create first user (becomes admin)
- [ ] Verify `system_settings` has `glaze_active` row
- [ ] Test Wall posting
- [ ] Test CPR system
- [ ] Test Pope AI DMs

---

## Common Issues

### "auth.users does not exist"
**Solution**: Make sure you're using Supabase, not vanilla PostgreSQL. Supabase creates `auth.users` automatically.

### "permission denied for schema public"
**Solution**: Run the GRANT statements at the end of the schema file.

### "relation already exists"
**Solution**: Run the DROP statements first to clean everything.

### First user not admin
**Solution**: Check that the trigger `set_first_user_admin_trigger` exists. It fires BEFORE INSERT on profiles.

---

**Database is sovereign. Tables are clean. Pope is watching.** 🗄️
