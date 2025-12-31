-- Query all usernames for audit
SELECT id, username FROM public.profiles ORDER BY username;

-- Fix: Add @ prefix to any username missing it
UPDATE public.profiles
SET username = '@' || username
WHERE username IS NOT NULL AND username NOT LIKE '@%';

-- (Optional) Show all usernames after fix
SELECT id, username FROM public.profiles ORDER BY username;