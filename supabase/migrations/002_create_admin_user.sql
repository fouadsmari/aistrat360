-- Create admin user profile
-- Note: This should be run manually in the Supabase dashboard SQL editor
-- after creating the user account in Authentication

-- First, create the user in Authentication manually with email: admin@example.com
-- Then run this script to give admin permissions

-- Insert admin profile (replace the UUID with the actual user ID from auth.users)
-- You can get the user ID by running: SELECT id FROM auth.users WHERE email = 'admin@example.com';

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  preferred_language
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
  'admin@example.com',
  'System Administrator',
  'admin',
  'fr'
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'System Administrator';

-- Grant admin permissions
INSERT INTO admin_permissions (
  user_id,
  permission
) VALUES 
  ('00000000-0000-0000-0000-000000000000', 'manage_users'),
  ('00000000-0000-0000-0000-000000000000', 'manage_subscriptions'),
  ('00000000-0000-0000-0000-000000000000', 'view_analytics'),
  ('00000000-0000-0000-0000-000000000000', 'system_settings')
ON CONFLICT (user_id, permission) DO NOTHING;

-- Instructions:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Invite user" or "Add user"
-- 3. Use email: admin@example.com and set a password
-- 4. Copy the generated user ID
-- 5. Replace the UUID above with the actual user ID
-- 6. Run this script in the SQL editor