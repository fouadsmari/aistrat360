-- Skip admin user creation in migration
-- This will be handled manually after authentication setup
-- to avoid foreign key constraint issues

-- Comment: Admin user should be created through the authentication system first,
-- then profile can be updated manually through the dashboard