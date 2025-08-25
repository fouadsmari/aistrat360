-- Fix profiles policy that causes JWT JSON error during user creation
-- The policy tries to parse JWT during trigger execution when JWT doesn't exist yet

-- Drop the problematic policy
DROP POLICY IF EXISTS "profiles_access_policy" ON public.profiles;

-- Create separate policies that don't conflict with trigger execution
-- Policy for regular user access (doesn't use JWT)
CREATE POLICY "users_own_profile_access" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for service role (for backend operations)
CREATE POLICY "service_role_profile_access" ON public.profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Simple policy for anon role during user creation (trigger context)
CREATE POLICY "anon_insert_during_signup" ON public.profiles
  FOR INSERT TO anon
  WITH CHECK (true);