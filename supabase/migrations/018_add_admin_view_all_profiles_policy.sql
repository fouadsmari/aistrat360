-- Add policy for admins to view all profiles in the admin panel

-- Policy for admin users to view all profiles (using database role check, not JWT)
CREATE POLICY "admin_view_all_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    -- Users can see their own profile OR they are admin/super_admin
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.role IN ('admin', 'super_admin')
    )
  );