-- Fix admin JWT metadata to include role
-- Update the admin user's metadata to include the role

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}', 
  '"admin"'
)
WHERE id = (
  SELECT id FROM profiles WHERE role = 'admin' LIMIT 1
);

-- Also set app_metadata as backup
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'),
  '{role}', 
  '"admin"'
)
WHERE id = (
  SELECT id FROM profiles WHERE role = 'admin' LIMIT 1
);