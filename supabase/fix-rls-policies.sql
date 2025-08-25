-- Fix infinite recursion in profiles RLS policies
-- This script fixes the RLS policies that are causing infinite recursion

-- First, drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- Create new, non-recursive policies
-- Policy for SELECT (read)
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Policy for INSERT
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy for UPDATE
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for DELETE (optional, usually profiles shouldn't be deleted)
CREATE POLICY "Users can delete own profile" 
ON profiles FOR DELETE 
TO authenticated
USING (auth.uid() = id);

-- Make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Also fix the trigger if it exists to avoid recursion
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a simpler function that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    new.id, 
    new.email,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();