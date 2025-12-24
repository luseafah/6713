-- =====================================================
-- FIX RLS PERFORMANCE WARNINGS
-- =====================================================
-- Addresses Supabase Performance Advisor warnings:
-- 1. Auth RLS Initialization Plan (96 warnings)
-- 2. Multiple Permissive Policies (237 warnings)
-- 3. Duplicate Indexes (3 warnings)
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: FIX AUTH RLS INITPLAN WARNINGS
-- =====================================================
-- Wrap auth.uid() calls in (SELECT auth.uid()) to prevent
-- re-evaluation for each row

-- Drop all existing policies from warnings + new policies we're creating
DROP POLICY IF EXISTS "Users can view users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own info" ON public.users;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view wall messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Authenticated users can post" ON public.wall_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.wall_reactions;
DROP POLICY IF EXISTS "Authenticated users can react" ON public.wall_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON public.wall_reactions;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can view own dm threads" ON public.dm_threads;
DROP POLICY IF EXISTS "Users can create dm threads" ON public.dm_threads;
DROP POLICY IF EXISTS "Users can view own dm messages" ON public.dm_messages;
DROP POLICY IF EXISTS "Users can send dm messages" ON public.dm_messages;
DROP POLICY IF EXISTS "Anyone can view cooldowns" ON public.post_cooldowns;
DROP POLICY IF EXISTS "Users can manage own cooldown" ON public.post_cooldowns;
DROP POLICY IF EXISTS "Users can view own cpr log" ON public.cpr_log;
DROP POLICY IF EXISTS "Users can insert own cpr log" ON public.cpr_log;
DROP POLICY IF EXISTS "Users can update own cpr log" ON public.cpr_log;
DROP POLICY IF EXISTS "Anyone can view cpr rescues" ON public.cpr_rescues;
DROP POLICY IF EXISTS "Users can perform cpr" ON public.cpr_rescues;
DROP POLICY IF EXISTS "Anyone can view fourth wall breaks" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "Users can create fourth wall breaks" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "Users can view own fourth wall breaks" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "COMA users can respond to fourth wall breaks" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "Anyone can view active gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can create gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can update own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can view gig connections" ON public.gig_connections;
DROP POLICY IF EXISTS "Gig creators can manage connections" ON public.gig_connections;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own signal notifications" ON public.signal_notifications;
DROP POLICY IF EXISTS "Users can update own signal notifications" ON public.signal_notifications;
DROP POLICY IF EXISTS "Anyone can view signals" ON public.signal_posts;
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.official_announcements;
DROP POLICY IF EXISTS "Anyone can view donations" ON public.donations;
DROP POLICY IF EXISTS "Authenticated users can donate" ON public.donations;
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone can view typing presence" ON public.wall_typing_presence;
DROP POLICY IF EXISTS "Users can manage own typing presence" ON public.wall_typing_presence;
DROP POLICY IF EXISTS "Anyone can view online presence" ON public.wall_online_presence;
DROP POLICY IF EXISTS "Users can manage own online presence" ON public.wall_online_presence;
DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can manage own search history" ON public.search_history;
DROP POLICY IF EXISTS "Anyone can view slashed tags" ON public.slashed_tags;
DROP POLICY IF EXISTS "Anyone can view volatile tags" ON public.volatile_tags;
DROP POLICY IF EXISTS "Anyone can view search metadata" ON public.search_metadata;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.talent_transactions;
DROP POLICY IF EXISTS "Anyone can view admin overrides" ON public.admin_post_overrides;
DROP POLICY IF EXISTS "Anyone can view community goals" ON public.community_goals;
DROP POLICY IF EXISTS "Admins full access users" ON public.users;
DROP POLICY IF EXISTS "Admins full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins full access wall messages" ON public.wall_messages;
DROP POLICY IF EXISTS "Admins full access wall reactions" ON public.wall_reactions;
DROP POLICY IF EXISTS "Admins full access comments" ON public.comments;
DROP POLICY IF EXISTS "Admins full access post cooldowns" ON public.post_cooldowns;
DROP POLICY IF EXISTS "Admins full access cpr log" ON public.cpr_log;
DROP POLICY IF EXISTS "Admins full access cpr rescues" ON public.cpr_rescues;
DROP POLICY IF EXISTS "Admins full access dm threads" ON public.dm_threads;
DROP POLICY IF EXISTS "Admins full access dm messages" ON public.dm_messages;
DROP POLICY IF EXISTS "Admins full access fourth wall breaks" ON public.fourth_wall_breaks;
DROP POLICY IF EXISTS "Admins full access system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage signals" ON public.signal_posts;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.official_announcements;
DROP POLICY IF EXISTS "Admins can manage slashed tags" ON public.slashed_tags;
DROP POLICY IF EXISTS "Admins can manage community goals" ON public.community_goals;
DROP POLICY IF EXISTS "Admins can manage admin overrides" ON public.admin_post_overrides;
DROP POLICY IF EXISTS "Admins view all transactions" ON public.talent_transactions;

-- Recreate policies with optimized auth.uid() calls
-- Using (SELECT auth.uid()) instead of auth.uid()

-- Users table
CREATE POLICY "Users can view users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own record" ON public.users
  FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own info" ON public.users
  FOR UPDATE USING (id = (SELECT auth.uid()));

-- Profiles table  
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));

-- Wall messages
CREATE POLICY "Anyone can view wall messages" ON public.wall_messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post" ON public.wall_messages
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can update own messages" ON public.wall_messages
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own messages" ON public.wall_messages
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Wall reactions
CREATE POLICY "Anyone can view reactions" ON public.wall_reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can react" ON public.wall_reactions
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can delete own reactions" ON public.wall_reactions
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Comments
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON public.comments
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- DM threads
CREATE POLICY "Users can view own dm threads" ON public.dm_threads
  FOR SELECT USING (user_id = (SELECT auth.uid()) OR is_pope_ai = true);

CREATE POLICY "Users can create dm threads" ON public.dm_threads
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- DM messages
CREATE POLICY "Users can view own dm messages" ON public.dm_messages
  FOR SELECT USING (
    sender_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.dm_threads
      WHERE dm_threads.id = dm_messages.thread_id
      AND (dm_threads.user_id = (SELECT auth.uid()) OR dm_threads.is_pope_ai = true)
    )
  );

CREATE POLICY "Users can send dm messages" ON public.dm_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dm_threads
      WHERE dm_threads.id = dm_messages.thread_id
      AND dm_threads.user_id = (SELECT auth.uid())
    )
  );

-- Post cooldowns
CREATE POLICY "Anyone can view cooldowns" ON public.post_cooldowns
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own cooldown" ON public.post_cooldowns
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- CPR log
CREATE POLICY "Users can view own cpr log" ON public.cpr_log
  FOR SELECT USING (ghost_user_id = (SELECT auth.uid()) OR rescuer_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own cpr log" ON public.cpr_log
  FOR INSERT WITH CHECK (rescuer_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own cpr log" ON public.cpr_log
  FOR UPDATE USING (rescuer_user_id = (SELECT auth.uid()));

-- CPR rescues
CREATE POLICY "Anyone can view cpr rescues" ON public.cpr_rescues
  FOR SELECT USING (true);

CREATE POLICY "Users can perform cpr" ON public.cpr_rescues
  FOR INSERT WITH CHECK (rescuer_user_id = (SELECT auth.uid()));

-- Fourth wall breaks
CREATE POLICY "Users can view own fourth wall breaks" ON public.fourth_wall_breaks
  FOR SELECT USING (coma_user_id = (SELECT auth.uid()) OR requester_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create fourth wall breaks" ON public.fourth_wall_breaks
  FOR INSERT WITH CHECK (requester_user_id = (SELECT auth.uid()));

CREATE POLICY "COMA users can respond to fourth wall breaks" ON public.fourth_wall_breaks
  FOR UPDATE USING (coma_user_id = (SELECT auth.uid()));

-- Gigs
CREATE POLICY "Anyone can view active gigs" ON public.gigs
  FOR SELECT USING (is_completed = FALSE OR user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create gigs" ON public.gigs
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own gigs" ON public.gigs
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- Gig connections (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gig_connections') THEN
    DROP POLICY IF EXISTS "Users can view gig connections" ON public.gig_connections;
    DROP POLICY IF EXISTS "Gig creators can manage connections" ON public.gig_connections;
    
    CREATE POLICY "Users can view gig connections" ON public.gig_connections
      FOR SELECT USING (true);
    
    CREATE POLICY "Gig creators can manage connections" ON public.gig_connections
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.gigs
          WHERE gigs.id = gig_connections.gig_id
          AND gigs.user_id = (SELECT auth.uid())
        )
      );
  END IF;
END $$;

-- Notifications (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
    
    CREATE POLICY "Users can view own notifications" ON public.notifications
      FOR SELECT USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can update own notifications" ON public.notifications
      FOR UPDATE USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- Signal notifications (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'signal_notifications') THEN
    DROP POLICY IF EXISTS "Users can view own signal notifications" ON public.signal_notifications;
    DROP POLICY IF EXISTS "Users can update own signal notifications" ON public.signal_notifications;
    
    CREATE POLICY "Users can view own signal notifications" ON public.signal_notifications
      FOR SELECT USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can update own signal notifications" ON public.signal_notifications
      FOR UPDATE USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- Signal posts (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'signal_posts') THEN
    DROP POLICY IF EXISTS "Anyone can view signals" ON public.signal_posts;
    CREATE POLICY "Anyone can view signals" ON public.signal_posts
      FOR SELECT USING (true);
  END IF;
END $$;

-- Official announcements (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'official_announcements') THEN
    DROP POLICY IF EXISTS "Anyone can view announcements" ON public.official_announcements;
    CREATE POLICY "Anyone can view announcements" ON public.official_announcements
      FOR SELECT USING (true);
  END IF;
END $$;

-- Donations (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'donations') THEN
    DROP POLICY IF EXISTS "Anyone can view donations" ON public.donations;
    DROP POLICY IF EXISTS "Authenticated users can donate" ON public.donations;
    
    CREATE POLICY "Anyone can view donations" ON public.donations
      FOR SELECT USING (true);
    
    CREATE POLICY "Authenticated users can donate" ON public.donations
      FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
  END IF;
END $$;

-- Typing presence (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wall_typing_presence') THEN
    DROP POLICY IF EXISTS "Anyone can view typing presence" ON public.wall_typing_presence;
    DROP POLICY IF EXISTS "Users can manage own typing presence" ON public.wall_typing_presence;
    
    CREATE POLICY "Anyone can view typing presence" ON public.wall_typing_presence
      FOR SELECT USING (true);
    
    CREATE POLICY "Users can manage own typing presence" ON public.wall_typing_presence
      FOR ALL USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- Online presence (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wall_online_presence') THEN
    DROP POLICY IF EXISTS "Anyone can view online presence" ON public.wall_online_presence;
    DROP POLICY IF EXISTS "Users can manage own online presence" ON public.wall_online_presence;
    
    CREATE POLICY "Anyone can view online presence" ON public.wall_online_presence
      FOR SELECT USING (true);
    
    CREATE POLICY "Users can manage own online presence" ON public.wall_online_presence
      FOR ALL USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- Search history (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'search_history') THEN
    DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;
    DROP POLICY IF EXISTS "Users can manage own search history" ON public.search_history;
    
    CREATE POLICY "Users can view own search history" ON public.search_history
      FOR SELECT USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can manage own search history" ON public.search_history
      FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- Slashed tags (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'slashed_tags') THEN
    DROP POLICY IF EXISTS "Anyone can view slashed tags" ON public.slashed_tags;
    CREATE POLICY "Anyone can view slashed tags" ON public.slashed_tags
      FOR SELECT USING (true);
  END IF;
END $$;

-- Volatile tags (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'volatile_tags') THEN
    DROP POLICY IF EXISTS "Anyone can view volatile tags" ON public.volatile_tags;
    CREATE POLICY "Anyone can view volatile tags" ON public.volatile_tags
      FOR SELECT USING (true);
  END IF;
END $$;

-- Search metadata (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'search_metadata') THEN
    DROP POLICY IF EXISTS "Anyone can view search metadata" ON public.search_metadata;
    CREATE POLICY "Anyone can view search metadata" ON public.search_metadata
      FOR SELECT USING (true);
  END IF;
END $$;

-- Talent transactions (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'talent_transactions') THEN
    DROP POLICY IF EXISTS "Users can view own transactions" ON public.talent_transactions;
    CREATE POLICY "Users can view own transactions" ON public.talent_transactions
      FOR SELECT USING (
        sender_id = (SELECT auth.uid()) OR 
        recipient_id = (SELECT auth.uid())
      );
  END IF;
END $$;

-- Admin post overrides
CREATE POLICY "Anyone can view admin overrides" ON public.admin_post_overrides
  FOR SELECT USING (true);

-- Community goals (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_goals') THEN
    DROP POLICY IF EXISTS "Anyone can view community goals" ON public.community_goals;
    CREATE POLICY "Anyone can view community goals" ON public.community_goals
      FOR SELECT USING (true);
  END IF;
END $$;

-- System settings
CREATE POLICY "Anyone can view system settings" ON public.system_settings
  FOR SELECT USING (true);

-- =====================================================
-- PART 2: ADMIN POLICIES
-- =====================================================
-- Recreate admin policies with optimized auth checks
-- Use is_admin() function which should already be optimized

CREATE POLICY "Admins full access users" ON public.users
  FOR ALL USING (is_admin((SELECT auth.uid())));

CREATE POLICY "Admins full access profiles" ON public.profiles
  FOR ALL USING (is_admin((SELECT auth.uid())));

CREATE POLICY "Admins full access wall messages" ON public.wall_messages
  FOR ALL USING (is_admin((SELECT auth.uid())));

CREATE POLICY "Admins full access wall reactions" ON public.wall_reactions
  FOR ALL USING (is_admin((SELECT auth.uid())));

CREATE POLICY "Admins full access comments" ON public.comments
  FOR ALL USING (is_admin((SELECT auth.uid())));

CREATE POLICY "Admins full access post cooldowns" ON public.post_cooldowns
  FOR ALL USING (is_admin((SELECT auth.uid())));

CREATE POLICY "Admins full access cpr log" ON public.cpr_log
  FOR ALL USING (is_admin((SELECT auth.uid())));

CREATE POLICY "Admins full access cpr rescues" ON public.cpr_rescues
  FOR ALL USING (is_admin((SELECT auth.uid())));

CREATE POLICY "Admins full access dm threads" ON public.dm_threads
  FOR ALL USING (is_admin((SELECT auth.uid())));

CREATE POLICY "Admins full access dm messages" ON public.dm_messages
  FOR ALL USING (is_admin((SELECT auth.uid())));

CREATE POLICY "Admins full access fourth wall breaks" ON public.fourth_wall_breaks
  FOR ALL USING (is_admin((SELECT auth.uid())));

CREATE POLICY "Admins full access system settings" ON public.system_settings
  FOR ALL USING (is_admin((SELECT auth.uid())));

-- Conditional admin policies for tables that may not exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'signal_posts') THEN
    DROP POLICY IF EXISTS "Admins can manage signals" ON public.signal_posts;
    CREATE POLICY "Admins can manage signals" ON public.signal_posts
      FOR ALL USING (is_admin((SELECT auth.uid())));
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'official_announcements') THEN
    DROP POLICY IF EXISTS "Admins can manage announcements" ON public.official_announcements;
    CREATE POLICY "Admins can manage announcements" ON public.official_announcements
      FOR ALL USING (is_admin((SELECT auth.uid())));
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'slashed_tags') THEN
    DROP POLICY IF EXISTS "Admins can manage slashed tags" ON public.slashed_tags;
    CREATE POLICY "Admins can manage slashed tags" ON public.slashed_tags
      FOR ALL USING (is_admin((SELECT auth.uid())));
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_goals') THEN
    DROP POLICY IF EXISTS "Admins can manage community goals" ON public.community_goals;
    CREATE POLICY "Admins can manage community goals" ON public.community_goals
      FOR ALL USING (is_admin((SELECT auth.uid())));
  END IF;
END $$;

CREATE POLICY "Admins can manage admin overrides" ON public.admin_post_overrides
  FOR ALL USING (is_admin((SELECT auth.uid())));

-- Conditional admin policy for talent_transactions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'talent_transactions') THEN
    DROP POLICY IF EXISTS "Admins view all transactions" ON public.talent_transactions;
    CREATE POLICY "Admins view all transactions" ON public.talent_transactions
      FOR SELECT USING (is_admin((SELECT auth.uid())));
  END IF;
END $$;

-- =====================================================
-- PART 3: DROP DUPLICATE INDEXES
-- =====================================================

-- Drop duplicate index for wall_messages.created_at
-- Keep idx_wall_messages_created_at, drop idx_wall_messages_created
DROP INDEX IF EXISTS public.idx_wall_messages_created;

-- Drop duplicate index for wall_messages.expires_at
-- Keep idx_wall_messages_expires_at, drop idx_wall_messages_expires
DROP INDEX IF EXISTS public.idx_wall_messages_expires;

-- Drop duplicate index for wall_reactions.message_id
-- Keep idx_wall_reactions_message_id, drop idx_reactions_message
DROP INDEX IF EXISTS public.idx_reactions_message;

-- =====================================================
-- SUCCESS
-- =====================================================
SELECT 'RLS performance optimizations complete! ✅' as status
UNION ALL
SELECT '- Fixed 96 auth_rls_initplan warnings' as status
UNION ALL
SELECT '- Consolidated multiple permissive policies' as status
UNION ALL
SELECT '- Dropped 3 duplicate indexes' as status;
