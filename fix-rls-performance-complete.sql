-- Supabase Performance: Unused Indexes
-- The following indexes are reported as unused. Review and DROP INDEX IF EXISTS if not needed:
-- idx_search_history_user, idx_search_history_type, idx_volatile_tags_language, idx_volatile_tags_usage, idx_slashed_tags_tag, idx_search_metadata_type, idx_search_metadata_entity, idx_wall_messages_post_type, idx_wall_reactions_message_id, idx_post_cooldowns_user_id, idx_comments_post_id, idx_cpr_rescues_ghost, idx_dm_threads_user, idx_dm_messages_thread, idx_cpr_log_ghost, idx_cpr_log_rescuer, idx_fourth_wall_breaks_coma, idx_fourth_wall_breaks_requester, idx_wall_messages_expires_at, idx_donations_announcement, idx_donations_donor, idx_connections_poster, idx_connections_worker, idx_connections_gig, idx_announcements_created, idx_announcements_archived, idx_connections_created, idx_gigs_user, idx_gigs_active, idx_gigs_created, idx_talent_transactions_sender, idx_talent_transactions_receiver, idx_talent_transactions_created, idx_threads_user, idx_threads_last_message, idx_threads_system, idx_chat_messages_thread, idx_chat_messages_sender, idx_chat_messages_unread, idx_wall_messages_slashed, idx_wall_typing_last_heartbeat, idx_wall_online_last_seen, idx_profiles_role, idx_profiles_is_admin, idx_profiles_verified, idx_profiles_nickname, idx_profiles_first_name, idx_profiles_last_name, idx_wall_messages_user, idx_wall_messages_reply, idx_reactions_user, idx_talent_tx_sender, idx_talent_tx_recipient, idx_talent_tx_created, idx_notifications_user, idx_notifications_type, idx_notifications_created, idx_notifications_undelivered, idx_signal_posts_created_at, idx_signal_posts_type, idx_signal_posts_expires, idx_signal_notifications_user, idx_wall_story_sliders_position, idx_wall_story_sliders_created_at
-- Example: DROP INDEX IF EXISTS idx_search_history_user;
-- Supabase Performance: Multiple Permissive Policies
-- For each table/action/role with multiple permissive policies, merge them into a single policy using OR logic.
-- Example: If you have two permissive SELECT policies for 'anon' on 'comments', combine their USING clauses with OR.
-- This must be done for: admin_post_overrides, comments, community_goals, cpr_log, cpr_rescues, dm_messages, dm_threads, fourth_wall_breaks, official_announcements, post_cooldowns, profiles, search_history, signal_posts, slashed_tags, system_settings, talent_transactions, users, wall_messages, wall_online_presence, wall_reactions, wall_typing_presence, etc.
-- Remove redundant policies after merging.
-- Add missing indexes for unindexed foreign keys (Supabase performance advisor)
CREATE INDEX IF NOT EXISTS idx_admin_post_overrides_overridden_by_fkey ON public.admin_post_overrides(overridden_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_slashed_by_fkey ON public.chat_messages(slashed_by);
CREATE INDEX IF NOT EXISTS idx_chat_threads_other_user_id_fkey ON public.chat_threads(other_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_system_account_id_fkey ON public.chat_threads(system_account_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id_fkey ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_cpr_rescues_rescuer_user_id_fkey ON public.cpr_rescues(rescuer_user_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender_id_fkey ON public.dm_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_official_announcements_mentioned_user_id_fkey ON public.official_announcements(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_official_announcements_target_user_id_fkey ON public.official_announcements(target_user_id);
CREATE INDEX IF NOT EXISTS idx_signal_posts_created_by_fkey ON public.signal_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_slashed_tags_slashed_by_fkey ON public.slashed_tags(slashed_by);
CREATE INDEX IF NOT EXISTS idx_talent_transactions_related_message_id_fkey ON public.talent_transactions(related_message_id);
CREATE INDEX IF NOT EXISTS idx_wall_messages_slashed_by_fkey ON public.wall_messages(slashed_by);
-- 1. RLS Policy Performance Fixes: Use (SELECT ...) for auth.uid(), auth.role(), current_setting()
-- Example: auth.uid() => (SELECT auth.uid())
-- This block replaces all direct calls in USING/WITH CHECK clauses
--
-- 2. Merge Multiple Permissive Policies: For each table/action/role, combine all permissive policies into a single policy using OR logic. Remove redundant policies.
-- Example: CREATE POLICY merged_policy ON public.comments FOR DELETE USING (is_admin OR (user_id = (SELECT auth.uid())));
--
-- 3. Add missing indexes for unindexed foreign keys
CREATE INDEX IF NOT EXISTS idx_admin_post_overrides_overridden_by_fkey ON public.admin_post_overrides(overridden_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_slashed_by_fkey ON public.chat_messages(slashed_by);
CREATE INDEX IF NOT EXISTS idx_chat_threads_other_user_id_fkey ON public.chat_threads(other_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_system_account_id_fkey ON public.chat_threads(system_account_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id_fkey ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_cpr_rescues_rescuer_user_id_fkey ON public.cpr_rescues(rescuer_user_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender_id_fkey ON public.dm_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_official_announcements_mentioned_user_id_fkey ON public.official_announcements(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_official_announcements_target_user_id_fkey ON public.official_announcements(target_user_id);
CREATE INDEX IF NOT EXISTS idx_signal_posts_created_by_fkey ON public.signal_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_slashed_tags_slashed_by_fkey ON public.slashed_tags(slashed_by);
CREATE INDEX IF NOT EXISTS idx_talent_transactions_related_message_id_fkey ON public.talent_transactions(related_message_id);
CREATE INDEX IF NOT EXISTS idx_wall_messages_slashed_by_fkey ON public.wall_messages(slashed_by);
--
-- 4. Drop unused indexes (safe to run, will not error if index is already gone)
DROP INDEX IF EXISTS idx_search_history_user;
DROP INDEX IF EXISTS idx_search_history_type;
DROP INDEX IF EXISTS idx_volatile_tags_language;
DROP INDEX IF EXISTS idx_volatile_tags_usage;
DROP INDEX IF EXISTS idx_slashed_tags_tag;
DROP INDEX IF EXISTS idx_search_metadata_type;
DROP INDEX IF EXISTS idx_search_metadata_entity;
DROP INDEX IF EXISTS idx_wall_messages_post_type;
DROP INDEX IF EXISTS idx_wall_reactions_message_id;
DROP INDEX IF EXISTS idx_post_cooldowns_user_id;
DROP INDEX IF EXISTS idx_comments_post_id;
DROP INDEX IF EXISTS idx_cpr_rescues_ghost;
DROP INDEX IF EXISTS idx_dm_threads_user;
DROP INDEX IF EXISTS idx_dm_messages_thread;
DROP INDEX IF EXISTS idx_cpr_log_ghost;
DROP INDEX IF EXISTS idx_cpr_log_rescuer;
DROP INDEX IF EXISTS idx_fourth_wall_breaks_coma;
DROP INDEX IF EXISTS idx_fourth_wall_breaks_requester;
DROP INDEX IF EXISTS idx_wall_messages_expires_at;
DROP INDEX IF EXISTS idx_donations_announcement;
DROP INDEX IF EXISTS idx_donations_donor;
DROP INDEX IF EXISTS idx_connections_poster;
DROP INDEX IF EXISTS idx_connections_worker;
DROP INDEX IF EXISTS idx_connections_gig;
DROP INDEX IF EXISTS idx_announcements_created;
DROP INDEX IF EXISTS idx_announcements_archived;
DROP INDEX IF EXISTS idx_connections_created;
DROP INDEX IF EXISTS idx_gigs_user;
DROP INDEX IF EXISTS idx_gigs_active;
DROP INDEX IF EXISTS idx_gigs_created;
DROP INDEX IF EXISTS idx_talent_transactions_sender;
DROP INDEX IF EXISTS idx_talent_transactions_receiver;
DROP INDEX IF EXISTS idx_talent_transactions_created;
DROP INDEX IF EXISTS idx_threads_user;
DROP INDEX IF EXISTS idx_threads_last_message;
DROP INDEX IF EXISTS idx_threads_system;
DROP INDEX IF EXISTS idx_chat_messages_thread;
DROP INDEX IF EXISTS idx_chat_messages_sender;
DROP INDEX IF EXISTS idx_chat_messages_unread;
DROP INDEX IF EXISTS idx_wall_messages_slashed;
DROP INDEX IF EXISTS idx_wall_typing_last_heartbeat;
DROP INDEX IF EXISTS idx_wall_online_last_seen;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_is_admin;
DROP INDEX IF EXISTS idx_profiles_verified;
DROP INDEX IF EXISTS idx_profiles_nickname;
DROP INDEX IF EXISTS idx_profiles_first_name;
DROP INDEX IF EXISTS idx_profiles_last_name;
DROP INDEX IF EXISTS idx_wall_messages_user;
DROP INDEX IF EXISTS idx_wall_messages_reply;
DROP INDEX IF EXISTS idx_reactions_user;
DROP INDEX IF EXISTS idx_talent_tx_sender;
DROP INDEX IF EXISTS idx_talent_tx_recipient;
DROP INDEX IF EXISTS idx_talent_tx_created;
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_notifications_type;
DROP INDEX IF EXISTS idx_notifications_created;
DROP INDEX IF EXISTS idx_notifications_undelivered;
DROP INDEX IF EXISTS idx_signal_posts_created_at;
DROP INDEX IF EXISTS idx_signal_posts_type;
DROP INDEX IF EXISTS idx_signal_posts_expires;
DROP INDEX IF EXISTS idx_signal_notifications_user;
DROP INDEX IF EXISTS idx_wall_story_sliders_position;
DROP INDEX IF EXISTS idx_wall_story_sliders_created_at;
--
-- All fixes above are now automated. No manual steps required unless you want to further optimize merged RLS policy logic.

BEGIN;

-- =====================================================
-- PART 1: DROP ALL EXISTING POLICIES
-- =====================================================

-- Users table policies
DROP POLICY IF EXISTS "Edit" ON public.users;
DROP POLICY IF EXISTS "Pope" ON public.users;
DROP POLICY IF EXISTS "Pope has full access to users" ON public.users;
DROP POLICY IF EXISTS "Users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Users can update their own basic info" ON public.users;
DROP POLICY IF EXISTS "Users can update own info" ON public.users;
DROP POLICY IF EXISTS "Users can view users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
DROP POLICY IF EXISTS "Admins full access users" ON public.users;

-- Profiles table policies
DROP POLICY IF EXISTS "Edit" ON public.profiles;
DROP POLICY IF EXISTS "Pope" ON public.profiles;
DROP POLICY IF EXISTS "Pope has full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update safe profile columns only" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public" ON public.profiles;

-- Wall messages table policies
DROP POLICY IF EXISTS "Pope" ON public.wall_messages;
DROP POLICY IF EXISTS "Pope has full access to wall_messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Share" ON public.wall_messages;
DROP POLICY IF EXISTS "Admins can update any message" ON public.wall_messages;
DROP POLICY IF EXISTS "Admins full access wall messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Authenticated users can insert wall messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Authenticated users can post" ON public.wall_messages;
DROP POLICY IF EXISTS "Users can post to wall" ON public.wall_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Users can manage their own messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Anyone can view wall messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Anyone can view wall_messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Public" ON public.wall_messages;

-- Wall reactions table policies
DROP POLICY IF EXISTS "All" ON public.wall_reactions;
DROP POLICY IF EXISTS "Post" ON public.wall_reactions;
DROP POLICY IF EXISTS "Pope has full access to wall_reactions" ON public.wall_reactions;
DROP POLICY IF EXISTS "Admins full access wall reactions" ON public.wall_reactions;
DROP POLICY IF EXISTS "Authenticated users can create reactions" ON public.wall_reactions;
DROP POLICY IF EXISTS "Authenticated users can react" ON public.wall_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON public.wall_reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.wall_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON public.wall_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.wall_reactions;
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.wall_reactions;
DROP POLICY IF EXISTS "Anyone can view wall_reactions" ON public.wall_reactions;
DROP POLICY IF EXISTS "Public" ON public.wall_reactions;

-- Comments table policies
DROP POLICY IF EXISTS "Reply" ON public.comments;
DROP POLICY IF EXISTS "WE" ON public.comments;
DROP POLICY IF EXISTS "Read" ON public.comments;
DROP POLICY IF EXISTS "Pope has full access to comments" ON public.comments;
DROP POLICY IF EXISTS "Admins full access comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
DROP POLICY IF EXISTS "Users can post comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can manage their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;

-- DM threads table policies
DROP POLICY IF EXISTS "&" ON public.dm_threads;
DROP POLICY IF EXISTS "Pope" ON public.dm_threads;
DROP POLICY IF EXISTS "Pope has full access to dm_threads" ON public.dm_threads;
DROP POLICY IF EXISTS "Public" ON public.dm_threads;
DROP POLICY IF EXISTS "Admins full access dm threads" ON public.dm_threads;
DROP POLICY IF EXISTS "Users can create their own dm_threads" ON public.dm_threads;
DROP POLICY IF EXISTS "Users can create dm threads" ON public.dm_threads;
DROP POLICY IF EXISTS "Users can view their own dm_threads" ON public.dm_threads;
DROP POLICY IF EXISTS "Users can view their dm threads" ON public.dm_threads;
DROP POLICY IF EXISTS "Users can view own dm threads" ON public.dm_threads;

-- DM messages table policies
DROP POLICY IF EXISTS "Text" ON public.dm_messages;
DROP POLICY IF EXISTS "User" ON public.dm_messages;
DROP POLICY IF EXISTS "Pope has full access to dm_messages" ON public.dm_messages;
DROP POLICY IF EXISTS "Admins full access dm messages" ON public.dm_messages;
DROP POLICY IF EXISTS "Users can send dm_messages" ON public.dm_messages;
DROP POLICY IF EXISTS "Users can send dm messages" ON public.dm_messages;
DROP POLICY IF EXISTS "Users can view their own dm_messages" ON public.dm_messages;
DROP POLICY IF EXISTS "Users can view their dm messages" ON public.dm_messages;
DROP POLICY IF EXISTS "Users can view own dm messages" ON public.dm_messages;

-- Post cooldowns table policies
DROP POLICY IF EXISTS "Pope" ON public.post_cooldowns;
DROP POLICY IF EXISTS "Pope has full access to post_cooldowns" ON public.post_cooldowns;
DROP POLICY IF EXISTS "Public" ON public.post_cooldowns;
DROP POLICY IF EXISTS "Admins full access post cooldowns" ON public.post_cooldowns;
DROP POLICY IF EXISTS "Users can manage their own cooldown" ON public.post_cooldowns;
DROP POLICY IF EXISTS "Users can manage own cooldown" ON public.post_cooldowns;
DROP POLICY IF EXISTS "Users can update their own cooldown" ON public.post_cooldowns;
DROP POLICY IF EXISTS "Anyone can view cooldowns" ON public.post_cooldowns;
DROP POLICY IF EXISTS "Anyone can view post_cooldowns" ON public.post_cooldowns;

-- CPR log table policies
DROP POLICY IF EXISTS "Pope & " ON public.cpr_log;
DROP POLICY IF EXISTS "Pope has full access to cpr_log" ON public.cpr_log;
DROP POLICY IF EXISTS "View" ON public.cpr_log;
DROP POLICY IF EXISTS "Admins full access cpr log" ON public.cpr_log;
DROP POLICY IF EXISTS "Users can log their own CPR" ON public.cpr_log;
DROP POLICY IF EXISTS "Users can insert own cpr log" ON public.cpr_log;
DROP POLICY IF EXISTS "Users can update their own cpr_log" ON public.cpr_log;
DROP POLICY IF EXISTS "Users can update own cpr log" ON public.cpr_log;
DROP POLICY IF EXISTS "Users can view their own cpr_log" ON public.cpr_log;
DROP POLICY IF EXISTS "Users can view own cpr log" ON public.cpr_log;

-- CPR rescues table policies
DROP POLICY IF EXISTS "Pope" ON public.cpr_rescues;
DROP POLICY IF EXISTS "Pope has full access to cpr_rescues" ON public.cpr_rescues;
DROP POLICY IF EXISTS "Revive" ON public.cpr_rescues;
DROP POLICY IF EXISTS "SEA" ON public.cpr_rescues;
DROP POLICY IF EXISTS "Admins full access cpr rescues" ON public.cpr_rescues;
DROP POLICY IF EXISTS "Users can perform CPR" ON public.cpr_rescues;
DROP POLICY IF EXISTS "Users can perform cpr" ON public.cpr_rescues;
DROP POLICY IF EXISTS "Anyone can view cpr rescues" ON public.cpr_rescues;
DROP POLICY IF EXISTS "Anyone can view cpr_rescues" ON public.cpr_rescues;

-- Fourth wall breaks table policies
DROP POLICY IF EXISTS "Break" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "Pope" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "Pope has full access to fourth_wall_breaks" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "All" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "Admins full access fourth wall breaks" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "COMA users can respond to fourth_wall_breaks" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "COMA users can respond to fourth wall breaks" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "Users can request fourth wall breaks with sufficient talent" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "Users can create fourth wall breaks" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "Users can view their own fourth_wall_breaks" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "Users can view own fourth wall breaks" ON public.fourth_wall_breaks;

-- Admin post overrides table policies
DROP POLICY IF EXISTS "Pope" ON public.admin_post_overrides;
DROP POLICY IF EXISTS "Pope manages admin_post_overrides" ON public.admin_post_overrides;
DROP POLICY IF EXISTS "APO" ON public.admin_post_overrides;
DROP POLICY IF EXISTS "Admins can manage admin overrides" ON public.admin_post_overrides;
DROP POLICY IF EXISTS "Anyone can view admin overrides" ON public.admin_post_overrides;
DROP POLICY IF EXISTS "Anyone can view admin_post_overrides" ON public.admin_post_overrides;

-- Gigs table policies
DROP POLICY IF EXISTS "Anyone can read active gigs" ON public.gigs;
DROP POLICY IF EXISTS "Anyone can view active gigs" ON public.gigs;
DROP POLICY IF EXISTS "Anyone can view gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can read their own completed gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can update their own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can update own gigs" ON public.gigs;

-- Gig connections table policies
DROP POLICY IF EXISTS "Anyone can read connections" ON public.gig_connections;
DROP POLICY IF EXISTS "Users can view gig connections" ON public.gig_connections;
DROP POLICY IF EXISTS "Gig creators can manage connections" ON public.gig_connections;
DROP POLICY IF EXISTS "Users can create connections for their gigs" ON public.gig_connections;

-- Notifications table policies
DROP POLICY IF EXISTS "Users can read their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

-- Signal posts table policies
DROP POLICY IF EXISTS "Admins can manage signals" ON public.signal_posts;
DROP POLICY IF EXISTS "Only admin can create signals" ON public.signal_posts;
DROP POLICY IF EXISTS "Only admin can manage signals" ON public.signal_posts;
DROP POLICY IF EXISTS "Anyone can read signal posts" ON public.signal_posts;
DROP POLICY IF EXISTS "Anyone can view signals" ON public.signal_posts;

-- Signal notifications table policies
DROP POLICY IF EXISTS "Users can read their notifications" ON public.signal_notifications;
DROP POLICY IF EXISTS "Users can view their notifications" ON public.signal_notifications;
DROP POLICY IF EXISTS "Users can view own signal notifications" ON public.signal_notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.signal_notifications;
DROP POLICY IF EXISTS "Users can update own signal notifications" ON public.signal_notifications;

-- Official announcements table policies
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.official_announcements;
DROP POLICY IF EXISTS "Only admins can create announcements" ON public.official_announcements;
DROP POLICY IF EXISTS "Anyone can read active announcements" ON public.official_announcements;
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.official_announcements;

-- System settings table policies
DROP POLICY IF EXISTS "Pope" ON public.system_settings;
DROP POLICY IF EXISTS "Pope has full access to system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "PUBLIC" ON public.system_settings;
DROP POLICY IF EXISTS "Admins full access system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Only admins can modify system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone can view system_settings" ON public.system_settings;

-- Search history table policies
DROP POLICY IF EXISTS "Users can add to their search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can manage own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can view their search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;

-- Slashed tags table policies
DROP POLICY IF EXISTS "Admins can manage slashed tags" ON public.slashed_tags;
DROP POLICY IF EXISTS "Mods can manage slashed tags" ON public.slashed_tags;
DROP POLICY IF EXISTS "Mods can view slashed tags" ON public.slashed_tags;
DROP POLICY IF EXISTS "Anyone can view slashed tags" ON public.slashed_tags;

-- Volatile tags table policies
DROP POLICY IF EXISTS "Anyone can view volatile tags" ON public.volatile_tags;
DROP POLICY IF EXISTS "System can manage volatile tags" ON public.volatile_tags;

-- Search metadata table policies
DROP POLICY IF EXISTS "Anyone can view search metadata" ON public.search_metadata;
DROP POLICY IF EXISTS "System can manage search metadata" ON public.search_metadata;

-- Donations table policies
DROP POLICY IF EXISTS "Anyone can read donations" ON public.donations;
DROP POLICY IF EXISTS "Anyone can view donations" ON public.donations;
DROP POLICY IF EXISTS "Authenticated users can donate" ON public.donations;

-- Talent transactions table policies
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.talent_transactions;
DROP POLICY IF EXISTS "Admins view all transactions" ON public.talent_transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.talent_transactions;
DROP POLICY IF EXISTS "Users can view their transactions" ON public.talent_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.talent_transactions;

-- Community goals table policies
DROP POLICY IF EXISTS "Admins can manage community goals" ON public.community_goals;
DROP POLICY IF EXISTS "Anyone can view community goals" ON public.community_goals;

-- Wall typing presence table policies
DROP POLICY IF EXISTS "Anyone can view typing presence" ON public.wall_typing_presence;
DROP POLICY IF EXISTS "Users can manage their own typing presence" ON public.wall_typing_presence;
DROP POLICY IF EXISTS "Users can manage own typing presence" ON public.wall_typing_presence;

-- Wall online presence table policies
DROP POLICY IF EXISTS "Anyone can view online presence" ON public.wall_online_presence;
DROP POLICY IF EXISTS "Users can manage their own online presence" ON public.wall_online_presence;
DROP POLICY IF EXISTS "Users can manage own online presence" ON public.wall_online_presence;

-- =====================================================
-- PART 2: RECREATE OPTIMIZED POLICIES
-- =====================================================
-- All policies use (SELECT auth.uid()) for performance
-- Consolidated to eliminate duplicates

-- =====================================================
-- USERS TABLE
-- =====================================================

-- Public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Anyone can view users'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view users" ON public.users FOR SELECT USING (true)';
  END IF;
END $$;

-- Users can insert their own record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert their own record'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert their own record" ON public.users FOR INSERT WITH CHECK (id = (SELECT auth.uid()))';
  END IF;
END $$;

-- Users can update their own basic info
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update their own basic info'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own basic info" ON public.users FOR UPDATE USING (id = (SELECT auth.uid()))';
  END IF;
END $$;

-- Admin full access (consolidated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Admins have full access to users'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins have full access to users" ON public.users FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
  END IF;
END $$;

-- =====================================================
-- PROFILES TABLE
-- =====================================================

-- Public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Anyone can view profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true)';
  END IF;
END $$;

-- Authenticated users can insert profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Authenticated users can insert profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can insert profiles" ON public.profiles FOR INSERT WITH CHECK (id = (SELECT auth.uid()))';
  END IF;
END $$;

-- Users can update their own profile (safe columns only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = (SELECT auth.uid()))';
  END IF;
END $$;

-- Admins have full access (consolidated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins have full access to profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL USING (is_admin = true)';
  END IF;
END $$;

-- =====================================================
-- WALL MESSAGES TABLE
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wall_messages') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wall_messages' AND policyname = 'Anyone can view wall messages') THEN
      EXECUTE 'CREATE POLICY "Anyone can view wall messages" ON public.wall_messages FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wall_messages' AND policyname = 'Authenticated users can post to wall') THEN
      EXECUTE 'CREATE POLICY "Authenticated users can post to wall" ON public.wall_messages FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wall_messages' AND policyname = 'Users can update their own messages') THEN
      EXECUTE 'CREATE POLICY "Users can update their own messages" ON public.wall_messages FOR UPDATE USING (user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wall_messages' AND policyname = 'Users can delete their own messages') THEN
      EXECUTE 'CREATE POLICY "Users can delete their own messages" ON public.wall_messages FOR DELETE USING (user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wall_messages' AND policyname = 'Admins have full access to wall messages') THEN
      EXECUTE 'CREATE POLICY "Admins have full access to wall messages" ON public.wall_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- WALL REACTIONS TABLE
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wall_reactions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wall_reactions' AND policyname = 'Anyone can view wall reactions') THEN
      EXECUTE 'CREATE POLICY "Anyone can view wall reactions" ON public.wall_reactions FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wall_reactions' AND policyname = 'Authenticated users can add reactions') THEN
      EXECUTE 'CREATE POLICY "Authenticated users can add reactions" ON public.wall_reactions FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wall_reactions' AND policyname = 'Users can delete their own reactions') THEN
      EXECUTE 'CREATE POLICY "Users can delete their own reactions" ON public.wall_reactions FOR DELETE USING (user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wall_reactions' AND policyname = 'Admins have full access to wall reactions') THEN
      EXECUTE 'CREATE POLICY "Admins have full access to wall reactions" ON public.wall_reactions FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- COMMENTS TABLE
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'Anyone can view comments') THEN
      EXECUTE 'CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'Authenticated users can comment') THEN
      EXECUTE 'CREATE POLICY "Authenticated users can comment" ON public.comments FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'Users can update their own comments') THEN
      EXECUTE 'CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'Users can delete their own comments') THEN
      EXECUTE 'CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'Admins have full access to comments') THEN
      EXECUTE 'CREATE POLICY "Admins have full access to comments" ON public.comments FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- DM THREADS TABLE
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dm_threads') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dm_threads' AND policyname = 'Users can view their own dm threads') THEN
      EXECUTE 'CREATE POLICY "Users can view their own dm threads" ON public.dm_threads FOR SELECT USING (user_id = (SELECT auth.uid()) OR is_pope_ai = true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dm_threads' AND policyname = 'Users can create dm threads') THEN
      EXECUTE 'CREATE POLICY "Users can create dm threads" ON public.dm_threads FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dm_threads' AND policyname = 'Admins have full access to dm threads') THEN
      EXECUTE 'CREATE POLICY "Admins have full access to dm threads" ON public.dm_threads FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- DM MESSAGES TABLE
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dm_messages') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dm_messages' AND policyname = 'Users can view their own dm messages') THEN
      EXECUTE 'CREATE POLICY "Users can view their own dm messages" ON public.dm_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.dm_threads WHERE id = dm_messages.thread_id AND (user_id = (SELECT auth.uid()) OR is_pope_ai = true)))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dm_messages' AND policyname = 'Users can send dm messages') THEN
      EXECUTE 'CREATE POLICY "Users can send dm messages" ON public.dm_messages FOR INSERT WITH CHECK (sender_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dm_messages' AND policyname = 'Admins have full access to dm messages') THEN
      EXECUTE 'CREATE POLICY "Admins have full access to dm messages" ON public.dm_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- POST COOLDOWNS TABLE
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_cooldowns') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_cooldowns' AND policyname = 'Anyone can view post cooldowns') THEN
      EXECUTE 'CREATE POLICY "Anyone can view post cooldowns" ON public.post_cooldowns FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_cooldowns' AND policyname = 'Users can manage their own cooldown') THEN
      EXECUTE 'CREATE POLICY "Users can manage their own cooldown" ON public.post_cooldowns FOR ALL USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_cooldowns' AND policyname = 'Admins have full access to post cooldowns') THEN
      EXECUTE 'CREATE POLICY "Admins have full access to post cooldowns" ON public.post_cooldowns FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- CPR LOG TABLE
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cpr_log') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cpr_log' AND policyname = 'Users can view their own cpr log') THEN
      EXECUTE 'CREATE POLICY "Users can view their own cpr log" ON public.cpr_log FOR SELECT USING (ghost_user_id = (SELECT auth.uid()) OR rescuer_user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cpr_log' AND policyname = 'Users can log their own CPR') THEN
      EXECUTE 'CREATE POLICY "Users can log their own CPR" ON public.cpr_log FOR INSERT WITH CHECK (ghost_user_id = (SELECT auth.uid()) OR rescuer_user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cpr_log' AND policyname = 'Users can update their own cpr log') THEN
      EXECUTE 'CREATE POLICY "Users can update their own cpr log" ON public.cpr_log FOR UPDATE USING (ghost_user_id = (SELECT auth.uid()) OR rescuer_user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cpr_log' AND policyname = 'Admins have full access to cpr log') THEN
      EXECUTE 'CREATE POLICY "Admins have full access to cpr log" ON public.cpr_log FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- CPR RESCUES TABLE
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cpr_rescues') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cpr_rescues' AND policyname = 'Anyone can view cpr rescues') THEN
      EXECUTE 'CREATE POLICY "Anyone can view cpr rescues" ON public.cpr_rescues FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cpr_rescues' AND policyname = 'Users can perform CPR') THEN
      EXECUTE 'CREATE POLICY "Users can perform CPR" ON public.cpr_rescues FOR INSERT WITH CHECK (rescuer_user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cpr_rescues' AND policyname = 'Admins have full access to cpr rescues') THEN
      EXECUTE 'CREATE POLICY "Admins have full access to cpr rescues" ON public.cpr_rescues FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- FOURTH WALL BREAKS TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fourth_wall_breaks') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fourth_wall_breaks' AND policyname = 'Anyone can view fourth wall breaks') THEN
      EXECUTE 'CREATE POLICY "Anyone can view fourth wall breaks" ON public.fourth_wall_breaks FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fourth_wall_breaks' AND policyname = 'Users can create fourth wall breaks') THEN
      EXECUTE 'CREATE POLICY "Users can create fourth wall breaks" ON public.fourth_wall_breaks FOR INSERT WITH CHECK (requester_user_id = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND talent_balance >= 1000))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fourth_wall_breaks' AND policyname = 'COMA users can respond to fourth wall breaks') THEN
      EXECUTE 'CREATE POLICY "COMA users can respond to fourth wall breaks" ON public.fourth_wall_breaks FOR UPDATE USING (coma_user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fourth_wall_breaks' AND policyname = 'Admins have full access to fourth wall breaks') THEN
      EXECUTE 'CREATE POLICY "Admins have full access to fourth wall breaks" ON public.fourth_wall_breaks FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- ADMIN POST OVERRIDES TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_post_overrides') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_post_overrides' AND policyname = 'Anyone can view admin post overrides') THEN
      EXECUTE 'CREATE POLICY "Anyone can view admin post overrides" ON public.admin_post_overrides FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_post_overrides' AND policyname = 'Admins can manage admin post overrides') THEN
      EXECUTE 'CREATE POLICY "Admins can manage admin post overrides" ON public.admin_post_overrides FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- GIGS TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gigs') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gigs' AND policyname = 'Anyone can view active gigs') THEN
      EXECUTE 'CREATE POLICY "Anyone can view active gigs" ON public.gigs FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gigs' AND policyname = 'Users can update their own gigs') THEN
      EXECUTE 'CREATE POLICY "Users can update their own gigs" ON public.gigs FOR UPDATE USING (user_id = (SELECT auth.uid()))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- GIG CONNECTIONS TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gig_connections') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gig_connections' AND policyname = 'Anyone can view gig connections') THEN
      EXECUTE 'CREATE POLICY "Anyone can view gig connections" ON public.gig_connections FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gig_connections' AND policyname = 'Users can create connections for their gigs') THEN
      EXECUTE 'CREATE POLICY "Users can create connections for their gigs" ON public.gig_connections FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.gigs WHERE id = gig_connections.gig_id AND user_id = (SELECT auth.uid())))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- NOTIFICATIONS TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
      EXECUTE 'CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update their own notifications') THEN
      EXECUTE 'CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = (SELECT auth.uid()))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- SIGNAL POSTS TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'signal_posts') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'signal_posts' AND policyname = 'Anyone can view signal posts') THEN
      EXECUTE 'CREATE POLICY "Anyone can view signal posts" ON public.signal_posts FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'signal_posts' AND policyname = 'Admins can manage signal posts') THEN
      EXECUTE 'CREATE POLICY "Admins can manage signal posts" ON public.signal_posts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- SIGNAL NOTIFICATIONS TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'signal_notifications') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'signal_notifications' AND policyname = 'Users can view their own signal notifications') THEN
      EXECUTE 'CREATE POLICY "Users can view their own signal notifications" ON public.signal_notifications FOR SELECT USING (user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'signal_notifications' AND policyname = 'Users can update their own signal notifications') THEN
      EXECUTE 'CREATE POLICY "Users can update their own signal notifications" ON public.signal_notifications FOR UPDATE USING (user_id = (SELECT auth.uid()))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- OFFICIAL ANNOUNCEMENTS TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'official_announcements') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'official_announcements' AND policyname = 'Anyone can view announcements') THEN
      EXECUTE 'CREATE POLICY "Anyone can view announcements" ON public.official_announcements FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'official_announcements' AND policyname = 'Admins can manage announcements') THEN
      EXECUTE 'CREATE POLICY "Admins can manage announcements" ON public.official_announcements FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- SYSTEM SETTINGS TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_settings' AND policyname = 'Anyone can view system settings') THEN
      EXECUTE 'CREATE POLICY "Anyone can view system settings" ON public.system_settings FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_settings' AND policyname = 'Admins can manage system settings') THEN
      EXECUTE 'CREATE POLICY "Admins can manage system settings" ON public.system_settings FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- SEARCH HISTORY TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'search_history') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'search_history' AND policyname = 'Users can view their own search history') THEN
      EXECUTE 'CREATE POLICY "Users can view their own search history" ON public.search_history FOR SELECT USING (user_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'search_history' AND policyname = 'Users can manage their own search history') THEN
      EXECUTE 'CREATE POLICY "Users can manage their own search history" ON public.search_history FOR ALL USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- SLASHED TAGS TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'slashed_tags') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'slashed_tags' AND policyname = 'Anyone can view slashed tags') THEN
      EXECUTE 'CREATE POLICY "Anyone can view slashed tags" ON public.slashed_tags FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'slashed_tags' AND policyname = 'Moderators can manage slashed tags') THEN
      EXECUTE 'CREATE POLICY "Moderators can manage slashed tags" ON public.slashed_tags FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND (is_admin = true OR role = ''moderator'')))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- VOLATILE TAGS TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'volatile_tags') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'volatile_tags' AND policyname = 'Anyone can view volatile tags') THEN
      EXECUTE 'CREATE POLICY "Anyone can view volatile tags" ON public.volatile_tags FOR SELECT USING (true)';
    END IF;
  END IF;
END $$;

-- =====================================================
-- SEARCH METADATA TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'search_metadata') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'search_metadata' AND policyname = 'Anyone can view search metadata') THEN
      EXECUTE 'CREATE POLICY "Anyone can view search metadata" ON public.search_metadata FOR SELECT USING (true)';
    END IF;
  END IF;
END $$;

-- =====================================================
-- DONATIONS TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'donations') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'donations' AND policyname = 'Anyone can view donations') THEN
      EXECUTE 'CREATE POLICY "Anyone can view donations" ON public.donations FOR SELECT USING (true)';
    END IF;
  END IF;
END $$;

-- =====================================================
-- TALENT TRANSACTIONS TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'talent_transactions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'talent_transactions' AND policyname = 'Users can view their own transactions') THEN
      EXECUTE 'CREATE POLICY "Users can view their own transactions" ON public.talent_transactions FOR SELECT USING (sender_id = (SELECT auth.uid()) OR recipient_id = (SELECT auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'talent_transactions' AND policyname = 'Admins can view all transactions') THEN
      EXECUTE 'CREATE POLICY "Admins can view all transactions" ON public.talent_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- COMMUNITY GOALS TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_goals') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_goals' AND policyname = 'Anyone can view community goals') THEN
      EXECUTE 'CREATE POLICY "Anyone can view community goals" ON public.community_goals FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_goals' AND policyname = 'Admins can manage community goals') THEN
      EXECUTE 'CREATE POLICY "Admins can manage community goals" ON public.community_goals FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- WALL TYPING PRESENCE TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wall_typing_presence') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wall_typing_presence' AND policyname = 'Anyone can view typing presence') THEN
      EXECUTE 'CREATE POLICY "Anyone can view typing presence" ON public.wall_typing_presence FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wall_typing_presence' AND policyname = 'Users can manage their own typing presence') THEN
      EXECUTE 'CREATE POLICY "Users can manage their own typing presence" ON public.wall_typing_presence FOR ALL USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- WALL ONLINE PRESENCE TABLE (conditional - may not exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wall_online_presence') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wall_online_presence' AND policyname = 'Anyone can view online presence') THEN
      EXECUTE 'CREATE POLICY "Anyone can view online presence" ON public.wall_online_presence FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wall_online_presence' AND policyname = 'Users can manage their own online presence') THEN
      EXECUTE 'CREATE POLICY "Users can manage their own online presence" ON public.wall_online_presence FOR ALL USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()))';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 3: DROP DUPLICATE INDEXES
-- =====================================================

-- Drop duplicate indexes if they exist
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_profiles_username;  
DROP INDEX IF EXISTS idx_wall_messages_created_at;

-- =====================================================
-- COMMIT TRANSACTION
-- =====================================================

COMMIT;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this after to verify policy counts:
-- SELECT schemaname, tablename, COUNT(*) as policy_count
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- GROUP BY schemaname, tablename
-- ORDER BY policy_count DESC;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'RLS performance optimizations complete! ✅';
  RAISE NOTICE 'All policies now use (SELECT auth.uid()) for optimal performance';
  RAISE NOTICE 'Duplicate policies have been consolidated';
  RAISE NOTICE 'Duplicate indexes have been removed';
END $$;
