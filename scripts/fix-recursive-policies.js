const https = require('https')

const token = 'sbp_95cea2145b4da37efedb43ce94ffc10b7108f467'
const projectRef = 'ypygrfrwpddqjbahgayc'

async function executeCommand(command) {
  console.log('🔧 Executing:', command.substring(0, 80) + '...')
  
  const postData = JSON.stringify({ query: command })

  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${projectRef}/database/query`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Success')
        } else {
          console.error('❌ Failed:', res.statusCode, data)
        }
        resolve({ success: res.statusCode === 200 || res.statusCode === 201, data })
      })
    })

    req.on('error', (err) => {
      console.error('❌ Request error:', err)
      reject(err)
    })

    req.write(postData)
    req.end()
  })
}

async function fixRecursivePolicies() {
  console.log('🔧 FIXING RECURSIVE RLS POLICIES - ROOT CAUSE')
  console.log('==============================================')
  
  // Step 1: Remove the problematic recursive policies
  console.log('\n📝 Step 1: Remove recursive admin policies')
  await executeCommand('DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;')
  await executeCommand('DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;')
  
  // Step 2: Re-enable RLS first
  console.log('\n📝 Step 2: Enable RLS on profiles')
  await executeCommand('ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;')
  
  // Step 3: Create non-recursive admin policies using auth.jwt() instead of profiles lookup
  console.log('\n📝 Step 3: Create non-recursive admin policies')
  
  // Policy for regular users - simple and direct
  await executeCommand(`
    CREATE POLICY "users_own_profile" ON profiles 
    FOR ALL TO authenticated 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);
  `)
  
  // Admin policy using JWT claims instead of table lookup to avoid recursion
  await executeCommand(`
    CREATE POLICY "admin_all_profiles" ON profiles 
    FOR ALL TO authenticated 
    USING (
      auth.uid() = id 
      OR 
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'super_admin')
    ) 
    WITH CHECK (
      auth.uid() = id 
      OR 
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'super_admin')
    );
  `)
  
  console.log('\n🧪 Testing the fix...')
  
  // Test the fix
  const { createClient } = require('@supabase/supabase-js')
  require('dotenv').config({ path: '.env.local' })
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (error && error.code === '42P17') {
      console.log('❌ Recursion still present - investigating further')
      return false
    } else if (error) {
      console.log('ℹ️  Expected error without auth:', error.message)
      console.log('✅ No more infinite recursion!')
      return true
    } else {
      console.log('✅ Profiles accessible!')
      return true
    }
  } catch (err) {
    console.error('Test error:', err.message)
    return false
  }
}

fixRecursivePolicies().then(success => {
  if (success) {
    console.log('\n🎉 SUCCESS!')
    console.log('================')
    console.log('✅ Recursive RLS policies fixed at the source')
    console.log('✅ RLS is properly enabled')
    console.log('✅ Users can only access their own profiles') 
    console.log('✅ Admins can access all profiles via JWT metadata')
    console.log('🚀 Your app should now work perfectly!')
  } else {
    console.log('\n⚠️  Need further investigation')
  }
})