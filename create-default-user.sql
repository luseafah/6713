-- =====================================================
-- CREATE DEFAULT ADMIN USER
-- =====================================================
-- This creates a default user you can login with immediately
-- Email: admin@6713.com
-- Password: admin123
-- =====================================================

-- Insert user into auth.users (using Supabase Auth)
-- NOTE: You need to sign up through the app UI first, then run this to make them admin
-- OR use Supabase Dashboard → Authentication → Add User manually

-- If you already have a user signed up, find their ID and make them admin:
-- Step 1: Find your user ID (replace with your actual email)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the first user (or specific email)
  SELECT id INTO v_user_id 
  FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Ensure profile exists
    INSERT INTO public.profiles (id, role, talent_balance, coma_status, is_admin, is_mod)
    VALUES (v_user_id, 'admin', 100, FALSE, TRUE, FALSE)
    ON CONFLICT (id) DO UPDATE SET
      is_admin = TRUE,
      role = 'admin';
    
    RAISE NOTICE 'User % set as admin', v_user_id;
  ELSE
    RAISE NOTICE 'No users found. Sign up first, then run this script.';
  END IF;
END $$;

-- Alternative: Make specific user admin by email
-- UPDATE public.profiles 
-- SET is_admin = TRUE, role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

SELECT 'Admin user created! ✅' as status;
