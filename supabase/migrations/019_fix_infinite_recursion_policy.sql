-- Fix infinite recursion in admin_view_all_profiles policy
-- The issue is that checking profiles table triggers the same policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "admin_view_all_profiles" ON public.profiles;

-- Create a non-recursive policy that uses JWT claims instead of database lookup
CREATE POLICY "admin_view_all_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    -- Users can see their own profile OR they have admin role in JWT
    auth.uid() = id 
    OR 
    (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin')
  );