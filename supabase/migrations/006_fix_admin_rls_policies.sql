-- Fix RLS policies for admin access to profiles table
-- The current policies check user_metadata for role, but we store roles in the profiles table

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "simple_own_access" ON public.profiles;

-- Create proper admin policy that checks the role from the profiles table itself
CREATE POLICY "admin_manage_all_profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (
    -- User can access their own profile OR user is admin/super_admin
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    -- User can modify their own profile OR user is admin/super_admin
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Keep the existing user access policy for regular users
-- This is already covered by the policy above, but keeping it explicit
CREATE POLICY "users_own_profile_access" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);