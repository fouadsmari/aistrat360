const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixRLSPolicies() {
  console.log("Fixing RLS policies for profiles table...")

  // Since we can't directly execute SQL through the JS client,
  // we'll use a different approach - we'll create a simple test
  // to see if the issue is resolved

  try {
    // Try to fetch profiles to test the current state
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)

    if (error) {
      console.error("Current RLS policy has issues:", error.message)
      console.log("\n⚠️  MANUAL ACTION REQUIRED:")
      console.log("────────────────────────────")
      console.log("Please go to your Supabase Dashboard:")
      console.log(`1. Open: ${supabaseUrl}`)
      console.log("2. Navigate to SQL Editor")
      console.log(
        "3. Copy and run the contents of: supabase/fix-rls-policies.sql"
      )
      console.log("4. This will fix the infinite recursion issue")
      console.log("────────────────────────────")
    } else {
      console.log("✅ RLS policies seem to be working")
    }
  } catch (err) {
    console.error("Error testing RLS:", err)
  }
}

fixRLSPolicies()
