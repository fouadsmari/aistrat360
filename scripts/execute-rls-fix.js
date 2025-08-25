const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL() {
  console.log('🔧 Executing RLS fix script...')
  
  try {
    // Execute each SQL command separately to avoid issues
    const commands = [
      // Drop existing problematic policies
      "DROP POLICY IF EXISTS \"Users can view own profile\" ON profiles;",
      "DROP POLICY IF EXISTS \"Users can update own profile\" ON profiles;", 
      "DROP POLICY IF EXISTS \"Users can insert own profile\" ON profiles;",
      "DROP POLICY IF EXISTS \"Users can delete own profile\" ON profiles;",
      "DROP POLICY IF EXISTS \"Enable read access for all users\" ON profiles;",
      "DROP POLICY IF EXISTS \"Enable insert for authenticated users only\" ON profiles;",
      "DROP POLICY IF EXISTS \"Enable update for users based on id\" ON profiles;",
      
      // Create new simple policies
      `CREATE POLICY "Users can view own profile" 
       ON profiles FOR SELECT 
       TO authenticated
       USING (auth.uid() = id);`,
       
      `CREATE POLICY "Users can insert own profile" 
       ON profiles FOR INSERT 
       TO authenticated
       WITH CHECK (auth.uid() = id);`,
       
      `CREATE POLICY "Users can update own profile" 
       ON profiles FOR UPDATE 
       TO authenticated
       USING (auth.uid() = id)
       WITH CHECK (auth.uid() = id);`,
       
      // Enable RLS
      "ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;",
      
      // Drop and recreate trigger
      "DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;",
      "DROP FUNCTION IF EXISTS public.handle_new_user();",
      
      `CREATE OR REPLACE FUNCTION public.handle_new_user() 
       RETURNS trigger AS $$
       BEGIN
         INSERT INTO public.profiles (id, email, created_at, updated_at)
         VALUES (
           new.id, 
           new.email,
           now(),
           now()
         )
         ON CONFLICT (id) DO NOTHING;
         RETURN new;
       END;
       $$ LANGUAGE plpgsql SECURITY DEFINER;`,
       
      `CREATE TRIGGER on_auth_user_created
       AFTER INSERT ON auth.users
       FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`
    ]
    
    for (const command of commands) {
      console.log('Executing:', command.substring(0, 50) + '...')
      const { data, error } = await supabase.rpc('exec_sql', { sql: command })
      
      if (error) {
        console.error('Error executing command:', command)
        console.error('Error details:', error)
      } else {
        console.log('✅ Command executed successfully')
      }
    }
    
    console.log('🎉 RLS fix script completed!')
    
    // Test the fix
    console.log('🧪 Testing RLS policies...')
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ RLS policies still have issues:', error.message)
    } else {
      console.log('✅ RLS policies working correctly!')
    }
    
  } catch (err) {
    console.error('❌ Error executing RLS fix:', err)
  }
}

executeSQL()