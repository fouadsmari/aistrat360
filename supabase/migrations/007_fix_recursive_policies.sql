-- Fix infinite recursion in RLS policies
-- The issue is that the policy checks the profiles table, which triggers the same policy

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "admin_manage_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile_access" ON public.profiles;

-- Create a simple policy that allows users to access their own profiles
-- and allows admin access based on JWT claims (not table lookup to avoid recursion)
CREATE POLICY "profiles_access_policy" ON public.profiles
  FOR ALL TO authenticated
  USING (
    -- User can access their own profile
    auth.uid() = id 
    OR 
    -- Admin access based on JWT metadata (avoids recursion)
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'super_admin')
    OR
    -- Admin access based on app_metadata (alternative)
    (auth.jwt() -> 'app_metadata' ->> 'role')::text IN ('admin', 'super_admin')
  )
  WITH CHECK (
    -- User can modify their own profile
    auth.uid() = id 
    OR 
    -- Admin can modify any profile
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'super_admin')
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role')::text IN ('admin', 'super_admin')
  );

-- Alternative: If JWT metadata doesn't work, create a bypass for service role
-- This allows the backend to work with service role key
CREATE POLICY "service_role_bypass" ON public.profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);