-- Add is_active column to profiles table for user management
-- This allows admin to activate/suspend users

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing users to be active by default
UPDATE profiles 
SET is_active = true 
WHERE is_active IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_active IS 'Indicates if the user account is active (true) or suspended (false)';