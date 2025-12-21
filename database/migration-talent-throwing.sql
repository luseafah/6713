-- Talent Throwing System
-- Atomic transaction for throwing Talents between users

-- Function: Throw Talents from sender to receiver
CREATE OR REPLACE FUNCTION throw_talents(
  sender_id UUID,
  receiver_id UUID,
  talent_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
  sender_balance INTEGER;
  receiver_balance INTEGER;
  new_sender_balance INTEGER;
  new_receiver_balance INTEGER;
BEGIN
  -- Validate amount (only 1, 5, or 10 Talents allowed)
  IF talent_amount NOT IN (1, 5, 10) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid amount. Can only throw 1, 5, or 10 Talents.'
    );
  END IF;
  
  -- Prevent self-throwing
  IF sender_id = receiver_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot throw Talents to yourself.'
    );
  END IF;
  
  -- Get sender's current balance
  SELECT talent_balance INTO sender_balance
  FROM profiles
  WHERE user_id = sender_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Sender profile not found.'
    );
  END IF;
  
  -- Check if sender has enough balance
  IF sender_balance < talent_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient Talent balance.'
    );
  END IF;
  
  -- Get receiver's current balance
  SELECT talent_balance INTO receiver_balance
  FROM profiles
  WHERE user_id = receiver_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Receiver profile not found.'
    );
  END IF;
  
  -- Perform atomic transaction
  -- Deduct from sender
  UPDATE profiles
  SET talent_balance = talent_balance - talent_amount
  WHERE user_id = sender_id
  RETURNING talent_balance INTO new_sender_balance;
  
  -- Add to receiver
  UPDATE profiles
  SET talent_balance = talent_balance + talent_amount
  WHERE user_id = receiver_id
  RETURNING talent_balance INTO new_receiver_balance;
  
  -- Return success with new balances
  RETURN jsonb_build_object(
    'success', true,
    'new_sender_balance', new_sender_balance,
    'new_receiver_balance', new_receiver_balance,
    'amount_thrown', talent_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transaction failed: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create talent_transactions table for logging (optional, for analytics)
CREATE TABLE IF NOT EXISTS talent_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT DEFAULT 'throw', -- 'throw', 'gig_payment', 'refill', etc.
  related_message_id UUID REFERENCES wall_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for transaction history queries
CREATE INDEX IF NOT EXISTS idx_talent_transactions_sender ON talent_transactions(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_talent_transactions_receiver ON talent_transactions(receiver_id, created_at DESC);

-- RLS Policies
ALTER TABLE talent_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON talent_transactions;
CREATE POLICY "Users can view their own transactions"
ON talent_transactions FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Enhanced throw_talents function with transaction logging
CREATE OR REPLACE FUNCTION throw_talents_with_log(
  sender_id UUID,
  receiver_id UUID,
  talent_amount INTEGER,
  message_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Call the main throw function
  SELECT throw_talents(sender_id, receiver_id, talent_amount) INTO result;
  
  -- If successful, log the transaction
  IF (result->>'success')::boolean = true THEN
    INSERT INTO talent_transactions (
      sender_id,
      receiver_id,
      amount,
      transaction_type,
      related_message_id
    ) VALUES (
      sender_id,
      receiver_id,
      talent_amount,
      'throw',
      message_id
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION throw_talents(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION throw_talents_with_log(UUID, UUID, INTEGER, UUID) TO authenticated;
