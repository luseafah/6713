-- Pope AI Admin Account Setup
-- This script makes the specified user the ONLY admin (Pope AI), auto-verifies them, and ensures no other admin exists.

-- 1. Demote all other admins (if any)
UPDATE public.profiles SET is_admin = FALSE, role = 'user' WHERE id <> '3e52b8f6-ee91-4d7a-9f0e-208bafc23810';

-- 2. Promote Pope AI account and verify
UPDATE public.profiles
SET is_admin = TRUE,
    role = 'admin',
    verification_status = 'verified',
    verified_at = NOW(),
    verified_name = 'Pope AI'
WHERE id = '3e52b8f6-ee91-4d7a-9f0e-208bafc23810';

-- 3. Prevent this account from making others admin (enforced in app logic)
-- (App logic: Only this account sees admin toggle, cannot promote others)

-- 4. (Optional) Lock down admin role assignment via RLS or triggers if needed
-- (App logic should enforce this, but can add DB-level protection if required)
