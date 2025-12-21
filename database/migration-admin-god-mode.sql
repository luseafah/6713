-- =====================================================
-- 6713 PROTOCOL: POPE AI ADMIN & VERIFICATION SYSTEM
-- =====================================================
-- "The Air-Lock" - Multi-phase authentication and verification
-- "God Mode" - Admin controls for moderation and economy
-- =====================================================

-- =====================================================
-- 1. EXTEND PROFILES WITH VERIFICATION FIELDS
-- =====================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verified_name TEXT, -- Legal/Real name (for Radio/Gigs)
ADD COLUMN IF NOT EXISTS display_name TEXT, -- How they appear on Wall
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE, -- For 2FA and Gig protocol
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' 
  CHECK (verification_status IN ('pending', 'photo_uploaded', 'id_verified', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS strike_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_shadow_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS talent_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS id_verification_url TEXT, -- KYC provider URL/ID
ADD COLUMN IF NOT EXISTS verification_notes TEXT, -- Admin notes
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_fine_at TIMESTAMP WITH TIME ZONE;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_strike_count ON profiles(strike_count);

-- =====================================================
-- 2. TALENT TRANSACTIONS (Economy Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS talent_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN ('purchase', 'gig_fee', 'gig_refund', 'fine', 'gift', 'throw', 'receive')
  ),
  amount INTEGER NOT NULL, -- Positive for credit, negative for debit
  balance_after INTEGER NOT NULL,
  reference_id UUID, -- Gig ID, Message ID, etc.
  reference_type TEXT, -- 'gig', 'message', 'admin_action'
  description TEXT,
  payment_intent_id TEXT, -- Stripe/payment provider ID
  admin_user_id UUID REFERENCES auth.users(id), -- If admin-initiated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talent_transactions_user ON talent_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_talent_transactions_type ON talent_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_talent_transactions_created ON talent_transactions(created_at DESC);

-- =====================================================
-- 3. ADMIN ACTIONS LOG (Moderation History)
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL CHECK (
    action_type IN ('strike', 'fine', 'gift', 'shadow_ban', 'unshadow_ban', 
                    'verify', 'reject', 'delete_message', 'delete_gig', 
                    'manual_mint', 'deverify')
  ),
  amount INTEGER, -- For fines/gifts
  reference_id UUID, -- Message/Gig/etc.
  reference_type TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at DESC);

-- =====================================================
-- 4. STRIPE PAYMENT RECORDS
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  payment_provider TEXT DEFAULT 'stripe',
  payment_intent_id TEXT UNIQUE,
  amount_usd NUMERIC(10, 2) NOT NULL,
  talents_credited INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payment_records_user ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_intent ON payment_records(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);

-- =====================================================
-- 5. VERIFICATION QUEUE (Air-Lock Management)
-- =====================================================

CREATE TABLE IF NOT EXISTS verification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  profile_photo_url TEXT,
  id_verification_status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  priority INTEGER DEFAULT 0, -- Higher = more urgent
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_verification_queue_status ON verification_queue(id_verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_queue_priority ON verification_queue(priority DESC, submitted_at ASC);

-- =====================================================
-- 6. FUNCTIONS: ADMIN OPERATIONS
-- =====================================================

-- Function: Issue Fine (Deduct Talents)
CREATE OR REPLACE FUNCTION admin_issue_fine(
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Verify admin role
  SELECT role = 'admin' INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_user_id;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get current balance
  SELECT talent_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_target_user_id;
  
  -- Calculate new balance (can't go negative)
  v_new_balance := GREATEST(v_current_balance - p_amount, 0);
  
  -- Update balance
  UPDATE profiles
  SET 
    talent_balance = v_new_balance,
    last_fine_at = NOW()
  WHERE id = p_target_user_id;
  
  -- Record transaction
  INSERT INTO talent_transactions (
    user_id, transaction_type, amount, balance_after,
    reference_id, reference_type, description, admin_user_id
  ) VALUES (
    p_target_user_id, 'fine', -p_amount, v_new_balance,
    p_reference_id, p_reference_type, p_reason, p_admin_user_id
  );
  
  -- Log admin action
  INSERT INTO admin_actions (
    admin_user_id, target_user_id, action_type, amount,
    reference_id, reference_type, reason
  ) VALUES (
    p_admin_user_id, p_target_user_id, 'fine', p_amount,
    p_reference_id, p_reference_type, p_reason
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'amount_deducted', p_amount,
    'new_balance', v_new_balance
  );
END;
$$;

-- Function: Issue Strike
CREATE OR REPLACE FUNCTION admin_issue_strike(
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_new_strike_count INTEGER;
BEGIN
  -- Verify admin role
  SELECT role = 'admin' INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_user_id;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Increment strike count
  UPDATE profiles
  SET strike_count = strike_count + 1
  WHERE id = p_target_user_id
  RETURNING strike_count INTO v_new_strike_count;
  
  -- Log admin action
  INSERT INTO admin_actions (
    admin_user_id, target_user_id, action_type,
    reference_id, reason, metadata
  ) VALUES (
    p_admin_user_id, p_target_user_id, 'strike',
    p_reference_id, p_reason, jsonb_build_object('strike_count', v_new_strike_count)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'strike_count', v_new_strike_count,
    'auto_ban', v_new_strike_count >= 3
  );
END;
$$;

-- Function: Shadow Ban User
CREATE OR REPLACE FUNCTION admin_shadow_ban(
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT role = 'admin' INTO v_is_admin FROM profiles WHERE id = p_admin_user_id;
  IF NOT v_is_admin THEN RETURN jsonb_build_object('success', false); END IF;

  UPDATE profiles SET is_shadow_banned = TRUE WHERE id = p_target_user_id;
  
  INSERT INTO admin_actions (admin_user_id, target_user_id, action_type, reason)
  VALUES (p_admin_user_id, p_target_user_id, 'shadow_ban', p_reason);
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: Gift Talents (Admin)
CREATE OR REPLACE FUNCTION admin_gift_talents(
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_new_balance INTEGER;
BEGIN
  SELECT role = 'admin' INTO v_is_admin FROM profiles WHERE id = p_admin_user_id;
  IF NOT v_is_admin THEN RETURN jsonb_build_object('success', false); END IF;

  UPDATE profiles
  SET talent_balance = talent_balance + p_amount
  WHERE id = p_target_user_id
  RETURNING talent_balance INTO v_new_balance;
  
  INSERT INTO talent_transactions (
    user_id, transaction_type, amount, balance_after, description, admin_user_id
  ) VALUES (
    p_target_user_id, 'gift', p_amount, v_new_balance, p_reason, p_admin_user_id
  );
  
  INSERT INTO admin_actions (admin_user_id, target_user_id, action_type, amount, reason)
  VALUES (p_admin_user_id, p_target_user_id, 'gift', p_amount, p_reason);
  
  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- Function: Approve Verification
CREATE OR REPLACE FUNCTION admin_approve_verification(
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT role = 'admin' INTO v_is_admin FROM profiles WHERE id = p_admin_user_id;
  IF NOT v_is_admin THEN RETURN jsonb_build_object('success', false); END IF;

  UPDATE profiles
  SET 
    verification_status = 'verified',
    is_verified = TRUE,
    verified_at = NOW(),
    verification_notes = p_notes
  WHERE id = p_target_user_id;
  
  UPDATE verification_queue
  SET 
    id_verification_status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = p_admin_user_id,
    admin_notes = p_notes
  WHERE user_id = p_target_user_id;
  
  INSERT INTO admin_actions (admin_user_id, target_user_id, action_type, reason)
  VALUES (p_admin_user_id, p_target_user_id, 'verify', p_notes);
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- =====================================================
-- 7. FUNCTIONS: PAYMENT & ECONOMY
-- =====================================================

-- Function: Process Talent Purchase
CREATE OR REPLACE FUNCTION process_talent_purchase(
  p_user_id UUID,
  p_payment_intent_id TEXT,
  p_amount_usd NUMERIC,
  p_talents INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Credit talents
  UPDATE profiles
  SET talent_balance = talent_balance + p_talents
  WHERE id = p_user_id
  RETURNING talent_balance INTO v_new_balance;
  
  -- Record transaction
  INSERT INTO talent_transactions (
    user_id, transaction_type, amount, balance_after,
    payment_intent_id, description
  ) VALUES (
    p_user_id, 'purchase', p_talents, v_new_balance,
    p_payment_intent_id, format('Purchased %s Talents for $%s', p_talents, p_amount_usd)
  );
  
  -- Record payment
  INSERT INTO payment_records (
    user_id, payment_intent_id, amount_usd, talents_credited, status, completed_at
  ) VALUES (
    p_user_id, p_payment_intent_id, p_amount_usd, p_talents, 'succeeded', NOW()
  );
  
  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- =====================================================
-- 8. VIEWS: ADMIN ANALYTICS
-- =====================================================

-- View: Economic Vital Signs
CREATE OR REPLACE VIEW admin_economic_stats AS
SELECT
  (SELECT COALESCE(SUM(talent_balance), 0) FROM profiles) AS total_talents_in_circulation,
  (SELECT COALESCE(SUM(amount_usd), 0) FROM payment_records WHERE status = 'succeeded') AS total_revenue_usd,
  (SELECT COUNT(*) FROM profiles WHERE verification_status = 'verified') AS verified_users,
  (SELECT COUNT(*) FROM profiles WHERE is_shadow_banned = TRUE) AS shadow_banned_users,
  (SELECT COUNT(*) FROM admin_actions WHERE action_type = 'fine' AND created_at > NOW() - INTERVAL '24 hours') AS fines_24h,
  (SELECT COALESCE(SUM(amount), 0) FROM talent_transactions WHERE transaction_type = 'fine') AS total_talents_fined;

-- =====================================================
-- 9. RLS POLICIES
-- =====================================================

-- Talent Transactions: Users see own, admins see all
ALTER TABLE talent_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY talent_transactions_user_own ON talent_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY talent_transactions_admin_all ON talent_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin Actions: Admins only
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_actions_admin_only ON admin_actions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Payment Records: Users see own, admins see all
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_records_user_own ON payment_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY payment_records_admin_all ON payment_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Verification Queue: Admins only
ALTER TABLE verification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY verification_queue_admin_only ON verification_queue
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- PROTOCOL NOTICE
-- =====================================================
-- The Air-Lock: Multi-phase authentication with ID verification
-- God Mode: Admin controls for moderation and economy
-- Talent Economy: $1.50 = 100 Talents
-- Strike System: 3 strikes = auto-ban
-- Shadow Ban: User can post, but no one sees their messages
-- =====================================================
