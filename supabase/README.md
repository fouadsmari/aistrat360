# Supabase Database Configuration

## Fix RLS Policies (URGENT)

There's an infinite recursion issue with the RLS policies on the profiles table. To fix this:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `fix-rls-policies.sql`
4. Paste and run the SQL script
5. The script will:
   - Drop existing problematic policies
   - Create new, non-recursive policies
   - Fix the trigger for auto-creating profiles

### Option 2: Using Supabase CLI

```bash
# First, link your project
npx supabase link --project-ref [your-project-ref]

# Then run the migration
npx supabase db push fix-rls-policies.sql
```

### What the fix does:

1. **Removes recursive RLS policies** that were causing infinite loops
2. **Creates simple, direct policies** that check `auth.uid() = id`
3. **Fixes the trigger** that auto-creates profiles for new users
4. **Ensures proper permissions** for users to manage their own profiles

### After applying the fix:

- Users can only view/edit their own profile
- New users will automatically get a profile created
- No more infinite recursion errors
- Profile updates will work correctly

## Important Notes

- Always backup your database before running migrations
- Test in a development environment first if possible
- The policies are designed for single-user profile access (users can only access their own profile)