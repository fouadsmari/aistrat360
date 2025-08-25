-- Fix anon role permissions for auth triggers (Official Supabase solution)
-- Source: https://supabase.com/docs/guides/troubleshooting/database-error-saving-new-user

-- Grant necessary permissions to anon role for trigger to work
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT, SELECT, UPDATE ON public.profiles TO anon;
GRANT INSERT, SELECT ON public.subscriptions TO anon;

-- Also grant to authenticated role for consistency
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT INSERT, SELECT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT, SELECT ON public.subscriptions TO authenticated;