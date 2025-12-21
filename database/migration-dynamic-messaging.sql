-- =====================================================
-- DYNAMIC MESSAGING SYSTEM FOR POPE AI
-- =====================================================
-- This migration creates the infrastructure for dynamic,
-- admin-editable automated messages throughout the app.
-- Messages support variable placeholders like {{user_name}}.

-- =====================================================
-- 1. SYSTEM MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS system_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id),
    
    CONSTRAINT valid_trigger_id CHECK (trigger_id ~ '^[a-z0-9_]+$')
);

COMMENT ON TABLE system_messages IS 'Dynamic Pope AI messages editable by admin';
COMMENT ON COLUMN system_messages.trigger_id IS 'Unique identifier for when message is triggered (e.g., on_verification, on_gig_finish)';
COMMENT ON COLUMN system_messages.variables IS 'Available placeholders: user_name, talent_balance, verified_name, username, etc.';
COMMENT ON COLUMN system_messages.category IS 'air_lock, god_mode, gig, wallet, coma, self_kill, general';

-- =====================================================
-- 2. QUICK REPLY TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS quick_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    icon TEXT,
    color TEXT DEFAULT 'yellow',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT quick_reply_length CHECK (LENGTH(content) <= 500)
);

COMMENT ON TABLE quick_replies IS 'One-tap admin responses for Chat/God Mode';
COMMENT ON COLUMN quick_replies.label IS 'Button text in admin UI (e.g., "Strike Warning")';
COMMENT ON COLUMN quick_replies.icon IS 'Lucide icon name (e.g., "AlertTriangle")';

-- =====================================================
-- 3. USER STATE EXTENSION
-- =====================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS user_state TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS coma_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS self_kill_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shrine_message TEXT,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
ADD CONSTRAINT valid_user_state CHECK (
    user_state IN ('new', 'active', 'coma', 'self_killed')
);

COMMENT ON COLUMN profiles.user_state IS 'User lifecycle state: new (air-lock), active (full access), coma (view-only), self_killed (shrine lock)';
COMMENT ON COLUMN profiles.coma_started_at IS 'When user entered coma state (admin can wake up)';
COMMENT ON COLUMN profiles.self_kill_date IS 'When user self-killed (3-day lock before full deletion)';
COMMENT ON COLUMN profiles.shrine_message IS 'Custom epitaph displayed during self-kill period';

-- Index for state queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_state ON profiles(user_state);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON profiles(last_activity_at);

-- =====================================================
-- 4. SEED DEFAULT MESSAGES
-- =====================================================

INSERT INTO system_messages (trigger_id, title, content, variables, category) VALUES
-- Air-Lock Messages
('on_verification_pending', 'Verification Pending', 
 'Welcome {{user_name}}. Your profile photo is under review by Pope AI. Manual frequency checks ensure only high-intent users enter the #Earth Wall and receive the $$$4U wealth signals.', 
 ARRAY['user_name'], 'air_lock'),

('on_verification_approved', 'Access Granted', 
 'Congratulations {{verified_name}}. Your frequency has been verified. You now have full access to the 6713 Protocol. Your Talent balance: {{talent_balance}}T. Remember: Your name is your bond.', 
 ARRAY['verified_name', 'talent_balance'], 'air_lock'),

('on_verification_rejected', 'Verification Rejected', 
 'Your verification was rejected. Reason: {{rejection_reason}}. You may re-submit with a clearer photo or contact support.', 
 ARRAY['rejection_reason'], 'air_lock'),

-- Gig Messages
('on_gig_creation', 'Gig Posted', 
 'Your Gig "{{gig_title}}" is live on the #Earth Wall. Fee: 10 Talents (non-refundable). Budget: {{gig_budget}}T. Expires in 3 days.', 
 ARRAY['gig_title', 'gig_budget'], 'gig'),

('on_gig_completion', 'Gig Verification Required', 
 'This Gig has been marked complete. Pope AI requires a 3-second voice note and group photo to verify. Once submitted, this Gig becomes un-deletable and your success will be visible for 3 days.', 
 ARRAY[], 'gig'),

('on_gig_verified', 'Gig Verified', 
 'Congratulations! Your Gig "{{gig_title}}" is now part of the Protocol. Your voice will enter the Radio rotation and your photo will appear in Stories.', 
 ARRAY['gig_title'], 'gig'),

('on_gig_delete_no_refund', 'Gig Deleted - No Refund', 
 'Your incomplete Gig "{{gig_title}}" has been deleted. The 10 Talent fee is non-refundable per the Terms of Frequency. Your commitment is the protocol.', 
 ARRAY['gig_title'], 'gig'),

-- Wallet Messages
('on_talent_purchase', 'Talents Credited', 
 '{{talents_purchased}} Talents have been added to your vault. New balance: {{talent_balance}}T. Exchange rate: $1.50 = 100T.', 
 ARRAY['talents_purchased', 'talent_balance'], 'wallet'),

('on_talent_throw', 'Talent Thrown', 
 'You threw {{talent_amount}}T to @{{recipient_username}}. Your generosity strengthens the frequency.', 
 ARRAY['talent_amount', 'recipient_username'], 'wallet'),

('on_talent_received', 'Talent Received', 
 '@{{sender_username}} threw {{talent_amount}}T to you! New balance: {{talent_balance}}T.', 
 ARRAY['sender_username', 'talent_amount', 'talent_balance'], 'wallet'),

-- God Mode Messages
('on_strike_issued', 'Strike Warning', 
 'You have been issued a Strike by Pope AI. Reason: {{strike_reason}}. Total strikes: {{strike_count}}/3. Three strikes result in de-verification and Air-Lock return.', 
 ARRAY['strike_reason', 'strike_count'], 'god_mode'),

('on_fine_issued', 'Fine Issued', 
 'You have been fined {{fine_amount}}T by Pope AI. Reason: {{fine_reason}}. New balance: {{talent_balance}}T. Moderation ensures protocol integrity.', 
 ARRAY['fine_amount', 'fine_reason', 'talent_balance'], 'god_mode'),

('on_shadow_ban', 'Shadow Ban Active', 
 'Your account has been shadow banned. Your posts are visible only to you. Contact support to appeal.', 
 ARRAY[], 'god_mode'),

('on_talent_gift', 'Talents Gifted', 
 'Pope AI has gifted you {{gift_amount}}T! Reason: {{gift_reason}}. New balance: {{talent_balance}}T. Your contribution is recognized.', 
 ARRAY['gift_amount', 'gift_reason', 'talent_balance'], 'god_mode'),

-- Coma State Messages
('on_coma_entry', 'Entering Coma State', 
 '{{user_name}}, you have been inactive for {{inactive_days}} days. Your account is now in Coma state. You can view content but cannot post, reply, or throw Talents. Resume activity to reactivate.', 
 ARRAY['user_name', 'inactive_days'], 'coma'),

('on_coma_wake', 'Welcome Back', 
 'Welcome back {{verified_name}}! Your account has been reactivated. Your frequency has been restored.', 
 ARRAY['verified_name'], 'coma'),

-- Self-Kill Messages
('on_self_kill_initiate', 'Self-Kill Initiated', 
 'You have initiated protocol termination. Your account will enter a 3-day Shrine period where others can view your legacy. After 3 days, all data will be permanently deleted. This action cannot be undone.', 
 ARRAY[], 'self_kill'),

('on_self_kill_shrine', 'Shrine Active', 
 'This user has left the frequency. Shrine expires: {{shrine_expiry}}. Message: {{shrine_message}}', 
 ARRAY['shrine_expiry', 'shrine_message'], 'self_kill'),

('on_self_kill_complete', 'Account Deleted', 
 'Your 3-day Shrine period has ended. Your account has been permanently deleted from the 6713 Protocol. Farewell.', 
 ARRAY[], 'self_kill')

ON CONFLICT (trigger_id) DO NOTHING;

-- =====================================================
-- 5. SEED QUICK REPLIES
-- =====================================================

INSERT INTO quick_replies (label, content, variables, icon, color, sort_order) VALUES
('Strike Warning', 'You are receiving a formal Strike. Reason: {{reason}}. Total strikes: {{strike_count}}/3. Three strikes result in de-verification.', ARRAY['reason', 'strike_count'], 'AlertTriangle', 'red', 1),
('Fine 10T', 'You have been fined 10 Talents. Reason: {{reason}}. Maintain protocol standards.', ARRAY['reason'], 'DollarSign', 'yellow', 2),
('Fine 50T', 'You have been fined 50 Talents. Reason: {{reason}}. Serious violations have serious consequences.', ARRAY['reason'], 'DollarSign', 'orange', 3),
('Shadow Ban', 'Your account has been shadow banned for: {{reason}}. Your posts are now hidden from other users.', ARRAY['reason'], 'EyeOff', 'red', 4),
('Gift 100T', 'Pope AI recognizes your contribution! You have been gifted 100 Talents. Reason: {{reason}}.', ARRAY['reason'], 'Gift', 'green', 5),
('Wake from Coma', 'Welcome back to the frequency! Your account has been reactivated.', ARRAY[], 'Zap', 'green', 6),
('Content Warning', 'Your recent post violates protocol guidelines. Please review the Terms of Frequency. Future violations may result in fines or strikes.', ARRAY[], 'AlertCircle', 'yellow', 7),
('High Quality', 'Excellent contribution to the protocol! Keep up the high-frequency energy.', ARRAY[], 'Star', 'gold', 8)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

ALTER TABLE system_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;

-- Anyone can read active messages
CREATE POLICY "Anyone can view active system messages"
ON system_messages FOR SELECT
TO authenticated
USING (is_active = true);

-- Only admins can modify messages
CREATE POLICY "Only admins can insert system messages"
ON system_messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Only admins can update system messages"
ON system_messages FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Only admins can delete system messages"
ON system_messages FOR DELETE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Quick replies (admin only)
CREATE POLICY "Only admins can view quick replies"
ON quick_replies FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Only admins can manage quick replies"
ON quick_replies FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- 7. FUNCTIONS - GET MESSAGE WITH VARIABLE SUBSTITUTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_system_message(
    p_trigger_id TEXT,
    p_variables JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
    title TEXT,
    content TEXT,
    category TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_content TEXT;
    v_title TEXT;
    v_category TEXT;
    v_key TEXT;
    v_value TEXT;
BEGIN
    -- Get the message template
    SELECT sm.title, sm.content, sm.category
    INTO v_title, v_content, v_category
    FROM system_messages sm
    WHERE sm.trigger_id = p_trigger_id
    AND sm.is_active = true;
    
    IF v_content IS NULL THEN
        RAISE EXCEPTION 'System message not found: %', p_trigger_id;
    END IF;
    
    -- Replace all variables
    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
    LOOP
        v_content := REPLACE(v_content, '{{' || v_key || '}}', v_value);
        v_title := REPLACE(v_title, '{{' || v_key || '}}', v_value);
    END LOOP;
    
    -- Return processed message
    RETURN QUERY SELECT v_title, v_content, v_category;
END;
$$;

COMMENT ON FUNCTION get_system_message IS 'Fetch system message and substitute variables';

-- =====================================================
-- 8. FUNCTIONS - USER STATE TRANSITIONS
-- =====================================================

CREATE OR REPLACE FUNCTION admin_enter_coma(
    p_user_id UUID,
    p_reason TEXT DEFAULT 'Inactivity'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    -- Check admin permission
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin role required';
    END IF;
    
    -- Update user state
    UPDATE profiles
    SET 
        user_state = 'coma',
        coma_started_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id
    AND user_state = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found or already in coma';
    END IF;
    
    -- Log admin action
    INSERT INTO admin_actions (
        admin_user_id,
        target_user_id,
        action_type,
        metadata
    ) VALUES (
        v_admin_id,
        p_user_id,
        'enter_coma',
        jsonb_build_object('reason', p_reason)
    );
    
    v_result := jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'new_state', 'coma',
        'message', 'User entered coma state'
    );
    
    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION admin_wake_from_coma(
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    -- Check admin permission
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin role required';
    END IF;
    
    -- Reactivate user
    UPDATE profiles
    SET 
        user_state = 'active',
        coma_started_at = NULL,
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id
    AND user_state = 'coma';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found or not in coma';
    END IF;
    
    -- Log admin action
    INSERT INTO admin_actions (
        admin_user_id,
        target_user_id,
        action_type,
        metadata
    ) VALUES (
        v_admin_id,
        p_user_id,
        'wake_from_coma',
        jsonb_build_object('timestamp', NOW())
    );
    
    v_result := jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'new_state', 'active',
        'message', 'User reactivated from coma'
    );
    
    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION user_self_kill(
    p_shrine_message TEXT DEFAULT 'Left the frequency'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_expiry TIMESTAMPTZ := NOW() + INTERVAL '3 days';
    v_result JSONB;
BEGIN
    -- Update user state
    UPDATE profiles
    SET 
        user_state = 'self_killed',
        self_kill_date = NOW(),
        shrine_message = p_shrine_message,
        updated_at = NOW()
    WHERE id = v_user_id
    AND user_state IN ('active', 'coma');
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cannot self-kill from current state';
    END IF;
    
    -- Schedule deletion (handled by cron job or cloud function)
    -- The actual deletion happens after 3 days
    
    v_result := jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'new_state', 'self_killed',
        'shrine_expiry', v_expiry,
        'message', 'Shrine period initiated. Account will be deleted in 3 days.'
    );
    
    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION admin_enter_coma IS 'Admin puts user into coma state (view-only)';
COMMENT ON FUNCTION admin_wake_from_coma IS 'Admin reactivates user from coma';
COMMENT ON FUNCTION user_self_kill IS 'User initiates 3-day shrine period before deletion';

-- =====================================================
-- 9. FUNCTIONS - UPDATE MESSAGE
-- =====================================================

CREATE OR REPLACE FUNCTION admin_update_system_message(
    p_trigger_id TEXT,
    p_title TEXT,
    p_content TEXT,
    p_variables TEXT[] DEFAULT NULL,
    p_category TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    -- Check admin permission
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin role required';
    END IF;
    
    -- Update message
    UPDATE system_messages
    SET 
        title = COALESCE(p_title, title),
        content = COALESCE(p_content, content),
        variables = COALESCE(p_variables, variables),
        category = COALESCE(p_category, category),
        updated_at = NOW(),
        updated_by = v_admin_id
    WHERE trigger_id = p_trigger_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'System message not found: %', p_trigger_id;
    END IF;
    
    v_result := jsonb_build_object(
        'success', true,
        'trigger_id', p_trigger_id,
        'message', 'System message updated'
    );
    
    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION admin_update_system_message IS 'Admin updates Pope AI message content';

-- =====================================================
-- 10. AUTO-UPDATE TIMESTAMP
-- =====================================================

CREATE OR REPLACE FUNCTION update_system_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_messages_update_timestamp
    BEFORE UPDATE ON system_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_system_message_timestamp();

CREATE TRIGGER quick_replies_update_timestamp
    BEFORE UPDATE ON quick_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_system_message_timestamp();

-- =====================================================
-- 11. VIEW - ACTIVE MESSAGES BY CATEGORY
-- =====================================================

CREATE OR REPLACE VIEW active_system_messages_by_category AS
SELECT 
    category,
    COUNT(*) as message_count,
    array_agg(trigger_id ORDER BY trigger_id) as trigger_ids
FROM system_messages
WHERE is_active = true
GROUP BY category;

COMMENT ON VIEW active_system_messages_by_category IS 'Summary of active messages grouped by category';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify installation
DO $$
BEGIN
    RAISE NOTICE '✅ Dynamic Messaging System installed successfully';
    RAISE NOTICE '📊 Tables created: system_messages, quick_replies';
    RAISE NOTICE '🔒 RLS policies applied';
    RAISE NOTICE '⚡ Functions created: get_system_message, admin_enter_coma, admin_wake_from_coma, user_self_kill';
    RAISE NOTICE '🎯 Seeded % default messages', (SELECT COUNT(*) FROM system_messages);
    RAISE NOTICE '💬 Seeded % quick replies', (SELECT COUNT(*) FROM quick_replies);
END $$;
