const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const connectionString = process.env.DATABASE_URL

if (!supabaseUrl) {
  console.error('Missing Supabase URL')
  process.exit(1)
}

// Extract connection details from Supabase URL
const projectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

console.log('\n🔧 To fix the RLS recursion issue:')
console.log('=====================================')
console.log(`1. Go to: https://supabase.com/dashboard/project/${projectId}/sql/new`)
console.log('2. Copy and execute this SQL:')
console.log('=====================================')

const fixSQL = `
-- Fix infinite recursion in profiles RLS policies
-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- Step 2: Create simple, non-recursive policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Step 3: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Fix the trigger for auto profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    preferred_language,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    'subscriber',
    'fr',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`

console.log(fixSQL)
console.log('=====================================')
console.log('3. Click "Run" to execute the SQL')
console.log('4. This will fix the infinite recursion issue permanently')
console.log('=====================================\n')

// Alternative: Try to execute via direct PostgreSQL connection if available
if (connectionString) {
  executeDirectSQL(connectionString, fixSQL)
} else {
  console.log('💡 No direct database connection available.')
  console.log('   Please execute the SQL manually in the Supabase dashboard.')
}

async function executeDirectSQL(connectionString, sql) {
  console.log('🔄 Attempting direct database connection...')
  
  const client = new Client({ connectionString })
  
  try {
    await client.connect()
    console.log('✅ Connected to database')
    
    await client.query(sql)
    console.log('✅ SQL executed successfully!')
    
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message)
    console.log('💡 Please execute the SQL manually in the Supabase dashboard.')
  } finally {
    await client.end()
  }
}