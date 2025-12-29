-- SQL to verify that all profile ids exist in auth.users
SELECT p.id
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- If this query returns any rows, those profiles have no matching user in auth.users and will violate the foreign key constraint.
-- To fix, delete those orphaned profiles:
-- DELETE FROM public.profiles WHERE id IN (SELECT p.id FROM public.profiles p LEFT JOIN auth.users u ON p.id = u.id WHERE u.id IS NULL);

-- To check all users that do NOT have a profile:
SELECT u.id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- These users are missing a profile and will not trigger the error, but may need a profile row if expected.
