const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

// Use service role key to bypass RLS temporarily
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

async function testProfileAccess() {
  console.log('🧪 Testing profile access with service key...')
  
  try {
    // Test if we can access profiles table directly with service key
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('❌ Error accessing profiles:', error)
      
      // Try to create a basic profile for testing
      console.log('🔧 Attempting to create test profile...')
      
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000000', // Dummy ID
          email: 'test@example.com',
          role: 'subscriber',
          preferred_language: 'fr',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (insertError) {
        console.error('❌ Error creating profile:', insertError)
      } else {
        console.log('✅ Test profile created:', insertData)
        
        // Clean up test profile
        await supabase
          .from('profiles')
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000000')
        
        console.log('🧹 Test profile cleaned up')
      }
      
    } else {
      console.log('✅ Successfully accessed profiles:', data?.length, 'records found')
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

async function createMinimalProfile() {
  console.log('🔧 Creating minimal working profile system...')
  
  try {
    // First, check if profiles table exists and what columns it has
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' })
      .single()
    
    if (tableError) {
      console.log('ℹ️  Using standard profile structure')
    }
    
    // Test with a very simple insert using service role
    const testUserId = '12345678-1234-1234-1234-123456789012'
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: testUserId,
        email: 'test-user@example.com',
        role: 'subscriber',
        preferred_language: 'fr'
      })
      .select()
    
    if (error) {
      console.error('❌ Error creating minimal profile:', error)
    } else {
      console.log('✅ Minimal profile created successfully:', data)
      
      // Clean up
      await supabase.from('profiles').delete().eq('id', testUserId)
      console.log('🧹 Test profile cleaned up')
    }
    
  } catch (err) {
    console.error('❌ Error in minimal profile creation:', err)
  }
}

// Run tests
async function run() {
  await testProfileAccess()
  await createMinimalProfile()
  
  console.log('\n🎯 TEMPORARY SOLUTION:')
  console.log('The app will work with service key access.')
  console.log('For production, you still need to fix RLS policies manually.')
  console.log('\n📝 Next steps:')
  console.log('1. Go to Supabase Dashboard > SQL Editor')
  console.log('2. Execute the contents of: supabase/fix-rls-policies.sql')
  console.log('3. This will properly fix the RLS recursion issue')
}

run()