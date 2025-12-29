-- Delete orphaned profiles (profiles with id not in auth.users)
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- Confirm handle_new_user trigger/function logic
-- (This is a reminder: The function should use NEW.id from auth.users and set defaults)
-- Example function logic:
-- INSERT INTO public.profiles (id, username, role, is_admin)
-- VALUES (NEW.id, NEW.raw_user_meta_data->>'username', 'unverified', FALSE);

-- You can run the DELETE statement above to fix the foreign key error.
-- Afterward, test the signup flow to confirm automatic profile creation works as expected.