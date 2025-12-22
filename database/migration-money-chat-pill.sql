-- =====================================================
-- 6713 PROTOCOL: $$$ CHAT PILL (WALL & MESSAGES)
-- =====================================================
-- The $$$ lives as a minimalist floating pill at the top of the Wall.
-- It's a dedicated, encrypted 1-on-1 corridor between User and Admin.
-- Strictly for buying Talents - user messages Admin, sends payment proof,
-- Admin manually tops up balance.
-- =====================================================

-- =====================================================
-- 1. MONEY CHAT MESSAGES TABLE
-- =====================================================
-- Dedicated encrypted chat between user and admin for talent purchases

CREATE TABLE IF NOT EXISTS money_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'voice')),
  content TEXT, -- Encrypted text content
  media_url TEXT, -- For payment screenshots or voice messages
  is_payment_proof BOOLEAN DEFAULT FALSE, -- Flag for payment screenshot
  is_strikethrough BOOLEAN DEFAULT FALSE, -- Admin can strikethrough non-transactional messages
  admin_user_id UUID REFERENCES users(id), -- Which admin sent it (if sender_type = 'admin')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_money_chat_user ON money_chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_money_chat_payment_proof ON money_chat_messages(is_payment_proof) WHERE is_payment_proof = TRUE;

-- =====================================================
-- 2. MONEY CHAT METADATA (Track User's Chat State)
-- =====================================================
-- Track unread count, last message time, etc.

CREATE TABLE IF NOT EXISTS money_chat_metadata (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_admin_response_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_money_chat_metadata_unread ON money_chat_metadata(unread_count) WHERE unread_count > 0;

-- =====================================================
-- 3. PAYMENT PROOFS TRACKING
-- =====================================================
-- Track external payment proofs sent by users

CREATE TABLE IF NOT EXISTS payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES money_chat_messages(id) ON DELETE CASCADE,
  proof_type TEXT DEFAULT 'screenshot' CHECK (proof_type IN ('screenshot', 'receipt', 'other')),
  amount_claimed NUMERIC(10, 2), -- Amount user claims they paid
  talents_requested INTEGER, -- How many Talents they're asking for
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  admin_notes TEXT,
  processed_by UUID REFERENCES users(id), -- Admin who processed it
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_user ON payment_proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON payment_proofs(status);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_pending ON payment_proofs(status) WHERE status = 'pending';

-- =====================================================
-- 4. FUNCTIONS: ADMIN MANUAL BALANCE TOP-UP
-- =====================================================

-- Function: Admin Manually Set Talent Balance (The Banker's Power)
CREATE OR REPLACE FUNCTION admin_set_talent_balance(
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_new_balance INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_payment_proof_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_old_balance INTEGER;
  v_difference INTEGER;
BEGIN
  -- Verify admin role
  SELECT role = 'admin' INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_user_id;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get current balance
  SELECT talent_balance INTO v_old_balance
  FROM profiles
  WHERE id = p_target_user_id;
  
  -- Calculate difference
  v_difference := p_new_balance - v_old_balance;
  
  -- Update balance
  UPDATE profiles
  SET talent_balance = p_new_balance
  WHERE id = p_target_user_id;
  
  -- Record transaction
  INSERT INTO talent_transactions (
    user_id, transaction_type, amount, balance_after,
    description, admin_user_id, reference_id, reference_type
  ) VALUES (
    p_target_user_id, 
    CASE WHEN v_difference > 0 THEN 'manual_topup' ELSE 'manual_deduct' END,
    v_difference, 
    p_new_balance,
    COALESCE(p_reason, 'Manual balance adjustment by admin'),
    p_admin_user_id,
    p_payment_proof_id,
    'payment_proof'
  );
  
  -- Log admin action
  INSERT INTO admin_actions (
    admin_user_id, target_user_id, action_type, amount,
    reason, reference_id, reference_type
  ) VALUES (
    p_admin_user_id, p_target_user_id, 'manual_mint', v_difference,
    COALESCE(p_reason, 'Talent balance adjusted'), p_payment_proof_id, 'payment_proof'
  );
  
  -- Mark payment proof as processed if provided
  IF p_payment_proof_id IS NOT NULL THEN
    UPDATE payment_proofs
    SET 
      status = 'processed',
      processed_by = p_admin_user_id,
      processed_at = NOW(),
      admin_notes = p_reason
    WHERE id = p_payment_proof_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'old_balance', v_old_balance,
    'new_balance', p_new_balance,
    'difference', v_difference
  );
END;
$$;

-- Function: Strikethrough Message (Admin Cleanup)
CREATE OR REPLACE FUNCTION admin_strikethrough_money_message(
  p_admin_user_id UUID,
  p_message_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verify admin role
  SELECT role = 'admin' INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_user_id;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Toggle strikethrough
  UPDATE money_chat_messages
  SET is_strikethrough = NOT is_strikethrough
  WHERE id = p_message_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: Send Money Chat Message
CREATE OR REPLACE FUNCTION send_money_chat_message(
  p_user_id UUID,
  p_sender_type TEXT,
  p_message_type TEXT,
  p_content TEXT DEFAULT NULL,
  p_media_url TEXT DEFAULT NULL,
  p_is_payment_proof BOOLEAN DEFAULT FALSE,
  p_admin_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Insert message
  INSERT INTO money_chat_messages (
    user_id, sender_type, message_type, content, media_url, 
    is_payment_proof, admin_user_id
  ) VALUES (
    p_user_id, p_sender_type, p_message_type, p_content, p_media_url,
    p_is_payment_proof, p_admin_user_id
  )
  RETURNING id INTO v_message_id;
  
  -- Update metadata
  INSERT INTO money_chat_metadata (user_id, last_message_at, unread_count)
  VALUES (p_user_id, NOW(), CASE WHEN p_sender_type = 'user' THEN 1 ELSE 0 END)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_message_at = NOW(),
    unread_count = CASE 
      WHEN p_sender_type = 'user' THEN money_chat_metadata.unread_count + 1
      ELSE 0 
    END,
    last_admin_response_at = CASE 
      WHEN p_sender_type = 'admin' THEN NOW() 
      ELSE money_chat_metadata.last_admin_response_at 
    END,
    updated_at = NOW();
  
  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_message_id
  );
END;
$$;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Money Chat Messages: Users see their own, admins see all
ALTER TABLE money_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS money_chat_messages_user_own ON money_chat_messages;
CREATE POLICY money_chat_messages_user_own ON money_chat_messages
  FOR ALL USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Money Chat Metadata: Users see their own, admins see all
ALTER TABLE money_chat_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS money_chat_metadata_user_own ON money_chat_metadata;
CREATE POLICY money_chat_metadata_user_own ON money_chat_metadata
  FOR ALL USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Payment Proofs: Users see their own, admins see all
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_proofs_user_own ON payment_proofs;
CREATE POLICY payment_proofs_user_own ON payment_proofs
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS payment_proofs_user_insert ON payment_proofs;
CREATE POLICY payment_proofs_user_insert ON payment_proofs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS payment_proofs_admin_update ON payment_proofs;
CREATE POLICY payment_proofs_admin_update ON payment_proofs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- 6. UPDATE EXISTING TRANSACTION TYPES
-- =====================================================

-- Add new transaction types for money chat
DO $$ 
BEGIN
  -- Drop and recreate the constraint with new types
  ALTER TABLE talent_transactions DROP CONSTRAINT IF EXISTS talent_transactions_transaction_type_check;
  
  ALTER TABLE talent_transactions ADD CONSTRAINT talent_transactions_transaction_type_check 
  CHECK (transaction_type IN (
    'purchase', 'gig_fee', 'gig_refund', 'fine', 'gift', 
    'throw', 'receive', 'manual_topup', 'manual_deduct'
  ));
END $$;

-- =====================================================
-- 7. VIEWS: ADMIN MONEY CHAT QUEUE
-- =====================================================

-- View: Pending Payment Proofs for Admin Review
CREATE OR REPLACE VIEW admin_payment_queue AS
SELECT 
  pp.id AS proof_id,
  pp.user_id,
  u.username,
  u.email,
  pp.amount_claimed,
  pp.talents_requested,
  pp.status,
  pp.created_at,
  pp.message_id,
  mcm.content AS message_content,
  mcm.media_url AS proof_url,
  p.talent_balance AS current_balance
FROM payment_proofs pp
JOIN users u ON pp.user_id = u.id
LEFT JOIN money_chat_messages mcm ON pp.message_id = mcm.id
LEFT JOIN profiles p ON pp.user_id = p.id
WHERE pp.status = 'pending'
ORDER BY pp.created_at ASC;

-- View: Active Money Chats (Users with pending messages)
CREATE OR REPLACE VIEW admin_active_money_chats AS
SELECT 
  mcm.user_id,
  u.username,
  u.email,
  COUNT(*) as message_count,
  MAX(mcm.created_at) as last_message_at,
  SUM(CASE WHEN mcm.is_payment_proof THEN 1 ELSE 0 END) as payment_proof_count,
  meta.unread_count
FROM money_chat_messages mcm
JOIN users u ON mcm.user_id = u.id
LEFT JOIN money_chat_metadata meta ON mcm.user_id = meta.user_id
WHERE mcm.created_at > NOW() - INTERVAL '7 days'
GROUP BY mcm.user_id, u.username, u.email, meta.unread_count
ORDER BY MAX(mcm.created_at) DESC;

-- =====================================================
-- PROTOCOL NOTICE: $$$ CHAT PILL
-- =====================================================
-- The $$$ Pill: Floating at the top of the Wall
-- Purpose: Strictly for buying Talents
-- Interface: Text, Images (payment screenshots), Voice recordings
-- Admin Role: "The Banker" - manually manages the economy
-- Flow: User sends proof → Admin reviews → Manual balance top-up
-- Style: Second "Pope AI" style - appears in Pulse (Messages) tab
-- =====================================================
