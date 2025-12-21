-- =====================================================
-- SECURITY VERIFICATION SCRIPT FOR 6713 GENESIS
-- =====================================================
-- Run this after applying schema.sql to verify everything is secure

-- ✅ 1. VERIFY RLS IS ENABLED ON ALL TABLES
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 
    'profiles', 
    'system_settings',
    'wall_messages',
    'admin_post_overrides',
    'comments',
    'wall_reactions',
    'post_cooldowns',
    'cpr_log',
    'cpr_rescues',
    'dm_threads',
    'dm_messages',
    'fourth_wall_breaks'
  )
ORDER BY tablename;

-- Expected: All tables should show rls_enabled = true

-- ✅ 2. VERIFY TRIGGERS EXIST
-- =====================================================
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_statement as function_called
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_assign_first_admin',
    'trigger_regenerate_coma_refills',
    'on_auth_user_created'
  )
ORDER BY trigger_name;

-- Expected: All three triggers should be present

-- ✅ 3. VERIFY YOUR ADMIN STATUS
-- =====================================================
-- Replace 'YOUR_EMAIL_HERE' with your actual email
SELECT 
  u.id,
  u.email,
  u.username,
  u.role as user_role,
  u.is_verified
FROM users u
WHERE u.email = 'YOUR_EMAIL_HERE';

-- Expected: role should be 'admin' and is_verified should be true

-- ✅ 4. VERIFY POLICIES EXIST
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command_type,
  CASE 
    WHEN policyname ILIKE '%pope%' OR policyname ILIKE '%admin%' THEN '👑 Admin'
    WHEN policyname ILIKE '%talent%' THEN '💎 Talent Gate'
    WHEN policyname ILIKE '%safe%' THEN '🔒 Security Lock'
    ELSE '📋 Standard'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ✅ 5. TEST TALENT LOOP PROTECTION
-- =====================================================
-- This query checks if the profiles UPDATE policy prevents talent changes
SELECT 
  policyname,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND policyname = 'Users can update safe profile columns only';

-- Expected: Check expression should contain logic preventing talent_balance changes

-- ✅ 6. VERIFY NO INFINITE RECURSION IN ADMIN CHECKS
-- =====================================================
SELECT 
  tablename,
  policyname,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND policyname ILIKE '%pope%';

-- Expected: Admin check should reference users.role, NOT profiles.role

-- =====================================================
-- SECURITY TEST QUERIES
-- =====================================================

-- Test 1: Can regular users update their talent_balance?
-- (This should FAIL in the app due to RLS)
-- UPDATE profiles SET talent_balance = 999999 WHERE id = auth.uid();

-- Test 2: Can admins update talent_balance?
-- (This should SUCCEED if you're admin)
-- UPDATE profiles SET talent_balance = 100 WHERE id = 'some-user-id';

-- Test 3: Can users create fourth wall breaks without talent?
-- (This should FAIL if talent_balance < 100)
-- INSERT INTO fourth_wall_breaks (coma_user_id, requester_user_id, message_content)
-- VALUES ('coma-user-id', auth.uid(), 'test message');

-- =====================================================
-- MANUAL ADMIN ASSIGNMENT (IF NEEDED)
-- =====================================================
-- If you need to manually promote yourself to admin, run:
-- UPDATE users SET role = 'admin', is_verified = true 
-- WHERE email = 'YOUR_EMAIL_HERE';

-- Then verify in profiles if needed:
-- SELECT * FROM profiles WHERE id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL_HERE');
