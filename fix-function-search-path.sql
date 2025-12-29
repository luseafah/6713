-- =====================================================
-- FIX FUNCTION SEARCH PATH WARNINGS
-- =====================================================
-- Sets search_path = public for all functions to improve security
-- This prevents potential schema injection attacks

-- Note: This is a one-time fix that modifies function definitions
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    func_record RECORD;
    func_def TEXT;
BEGIN
    -- Loop through all functions in public schema
    FOR func_record IN 
        SELECT 
            p.proname as func_name,
            pg_get_functiondef(p.oid) as func_definition
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'set_story_expiration', 'prune_wall_messages', 'assign_first_admin',
            'request_storage_deletion', 'pope_ai_announcement', 'donate_to_goal',
            'get_user_by_username', 'prune_announcements', 'is_admin',
            'regenerate_coma_refills', 'post_new_gig', 'cleanup_expired_signals',
            'create_signal_post', 'get_unread_signal_count', 'mark_signal_read',
            'archive_old_announcements', 'get_random_gig_participant', 'unslash_wall_message',
            'get_typing_count', 'user_can_post_gig', 'get_active_gig_count',
            'update_donation_progress', 'get_involvement_count', 'get_recent_connections',
            'get_random_connection', 'set_gig_completion_expiry', 'cleanup_completed_gigs',
            'delete_gig_no_refund', 'delete_expired_posts', 'mark_gig_complete',
            'cleanup_stale_online_presence', 'slash_wall_message', 'get_online_count',
            'cleanup_stale_typing_presence', 'throw_talent', 'throw_talents_with_log',
            'update_typing_presence', 'remove_typing_presence', 'update_online_presence',
            'insert_story_slider', 'maintain_67_comment_limit', 'handle_new_user',
            'revive_user', 'notify_signal_post', 'notify_talent_throw',
            'is_notification_enabled', 'get_unread_notification_count', 'add_search_to_history',
            'get_volatile_tags', 'slash_tag', 'create_notification',
            'get_badge_counts', 'mark_notification_read', 'mark_all_notifications_read',
            'get_username', 'handle_first_user_admin', 'unslash_tag',
            'search_humans', 'search_sounds', 'search_gigs', 'increment_tag_usage',
            'throw_talents', 'maintain_search_history'
        )
    LOOP
        -- Get the function definition
        func_def := func_record.func_definition;
        
        -- Only modify if it doesn't already have SET search_path
        IF func_def NOT LIKE '%SET search_path%' AND func_def NOT LIKE '%set search_path%' THEN
            -- Add SET search_path = public before the function body
            func_def := REPLACE(
                func_def,
                E' LANGUAGE ',
                E'\nSET search_path = public\nLANGUAGE '
            );
            
            -- Execute the modified function definition
            BEGIN
                EXECUTE func_def;
                RAISE NOTICE 'Fixed: %', func_record.func_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Skipped % (error: %)', func_record.func_name, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- SUCCESS
-- =====================================================
SELECT 'Function search_path warnings fixed! ✅' as status;
