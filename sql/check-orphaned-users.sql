-- Find orphaned profiles (profiles with no matching auth.users)
SELECT p.id, p.username FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- Find auth.users with no matching profile
SELECT u.id, u.email FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- (Optional) Delete orphaned profiles
-- DELETE FROM public.profiles WHERE id IN (
--   SELECT p.id FROM public.profiles p
--   LEFT JOIN auth.users u ON p.id = u.id
--   WHERE u.id IS NULL
-- );

-- (Optional) Insert missing profiles for users
-- INSERT INTO public.profiles (id, username, role, is_admin)
-- SELECT u.id, '@' || split_part(u.email, '@', 1), 'unverified', FALSE
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.id
-- WHERE p.id IS NULL;
