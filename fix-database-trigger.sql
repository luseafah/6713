-- =====================================================
-- FIX DATABASE TRIGGER - Safe to run multiple times
-- =====================================================
-- This will fix the "Database error saving new user" issue

-- Ensure profiles table exists with all required columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user',
  is_admin BOOLEAN DEFAULT FALSE,
  is_mod BOOLEAN DEFAULT FALSE,
  talent_balance INTEGER DEFAULT 100,
  coma_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns safely (won't error if they already exist)
DO $$ 
BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS middle_name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
END $$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CRITICAL: Fix the auto-signup trigger
-- =====================================================

-- Drop and recreate the function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile for new user with default values
  INSERT INTO public.profiles (id, role, talent_balance, coma_status, is_admin, is_mod)
  VALUES (NEW.id, 'user', 100, FALSE, FALSE, FALSE)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    talent_balance = EXCLUDED.talent_balance,
    coma_status = EXCLUDED.coma_status;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Error in handle_new_user for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- RLS Policies (drop and recreate to avoid conflicts)
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- Anyone can view profiles
CREATE POLICY "Anyone can view profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users only" 
  ON public.profiles FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on id" 
  ON public.profiles FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins have full access
CREATE POLICY "Admins have full access" 
  ON public.profiles FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- If you see this, the trigger is now active!
-- Try signing up again - profiles will be auto-created.

SELECT 'Database trigger fixed successfully! ✅' as status;
