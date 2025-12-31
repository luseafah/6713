-- Enforce @username prefix in profiles table
-- 1. Constraint: username must start with '@'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS username_at_prefix_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT username_at_prefix_check CHECK (username LIKE '@%');

-- 2. Update existing usernames to have @ prefix if missing
UPDATE public.profiles
SET username = '@' || username
WHERE username IS NOT NULL AND username NOT LIKE '@%';

-- 3. (Optional) Add a trigger to auto-correct usernames on insert/update
CREATE OR REPLACE FUNCTION enforce_at_prefix_on_username()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.username IS NOT NULL AND LEFT(NEW.username, 1) <> '@' THEN
    NEW.username := '@' || NEW.username;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_at_prefix_on_username ON public.profiles;
CREATE TRIGGER trg_enforce_at_prefix_on_username
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_at_prefix_on_username();
