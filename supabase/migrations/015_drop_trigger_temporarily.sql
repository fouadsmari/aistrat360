-- Temporarily drop the trigger to test if it's the source of the problem
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;