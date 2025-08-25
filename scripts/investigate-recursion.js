const https = require('https')

const token = 'sbp_95cea2145b4da37efedb43ce94ffc10b7108f467'
const projectRef = 'ypygrfrwpddqjbahgayc'

async function executeQuery(query, description) {
  console.log(`\n🔍 ${description}`)
  console.log('Query:', query.substring(0, 100) + '...')
  
  const postData = JSON.stringify({ query })

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
          console.log('✅ Query successful')
          try {
            const result = JSON.parse(data)
            console.log('📊 Results:', JSON.stringify(result, null, 2))
          } catch (e) {
            console.log('📊 Raw response:', data)
          }
        } else {
          console.error('❌ Query failed:', res.statusCode, data)
        }
        resolve(data)
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

async function investigateRecursion() {
  console.log('🕵️ INVESTIGATING RLS RECURSION ROOT CAUSE')
  console.log('===========================================')
  
  // 1. Check all functions that reference profiles table
  await executeQuery(`
    SELECT 
      routine_name, 
      routine_definition,
      routine_type
    FROM information_schema.routines 
    WHERE routine_definition ILIKE '%profiles%' 
    AND routine_schema = 'public';
  `, 'Functions referencing profiles table')
  
  // 2. Check all triggers on profiles table
  await executeQuery(`
    SELECT 
      trigger_name,
      event_manipulation,
      action_statement,
      action_timing
    FROM information_schema.triggers 
    WHERE event_object_table = 'profiles';
  `, 'Triggers on profiles table')
  
  // 3. Check all triggers on auth.users that might affect profiles
  await executeQuery(`
    SELECT 
      trigger_name,
      event_manipulation,
      action_statement,
      action_timing
    FROM information_schema.triggers 
    WHERE event_object_table = 'users' 
    AND event_object_schema = 'auth';
  `, 'Triggers on auth.users table')
  
  // 4. Check for any RLS policies that still exist
  await executeQuery(`
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies 
    WHERE tablename = 'profiles';
  `, 'Current RLS policies on profiles')
  
  // 5. Check table structure and constraints
  await executeQuery(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND table_schema = 'public';
  `, 'Profiles table structure')
  
  // 6. Check for foreign key constraints
  await executeQuery(`
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'profiles';
  `, 'Foreign key constraints on profiles')
  
  console.log('\n🎯 Investigation complete. Analyzing results...')
}

investigateRecursion()