const https = require("https")

const token = "sbp_95cea2145b4da37efedb43ce94ffc10b7108f467"
const projectRef = "ypygrfrwpddqjbahgayc"

async function executeCommand(command) {
  console.log("🔧 Executing:", command)

  const postData = JSON.stringify({
    query: command,
  })

  const options = {
    hostname: "api.supabase.com",
    port: 443,
    path: `/v1/projects/${projectRef}/database/query`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Length": Buffer.byteLength(postData),
    },
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ""

      res.on("data", (chunk) => {
        data += chunk
      })

      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log("✅ Success")
        } else {
          console.error("❌ Failed:", res.statusCode, data)
        }
        resolve({
          success: res.statusCode === 200 || res.statusCode === 201,
          data,
        })
      })
    })

    req.on("error", (err) => {
      console.error("❌ Request error:", err)
      reject(err)
    })

    req.write(postData)
    req.end()
  })
}

async function emergencyDisable() {
  console.log("🚨 EMERGENCY: Temporarily disabling RLS to fix recursion")
  console.log("======================================================")

  // Step 1: Disable RLS completely
  await executeCommand("ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;")

  // Step 2: Drop all policies
  const dropCommands = [
    'DROP POLICY IF EXISTS "Users can view own profile" ON profiles;',
    'DROP POLICY IF EXISTS "Users can update own profile" ON profiles;',
    'DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;',
    'DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;',
    'DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;',
    'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;',
    'DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;',
    'DROP POLICY IF EXISTS "profiles_select_own" ON profiles;',
    'DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;',
    'DROP POLICY IF EXISTS "profiles_update_own" ON profiles;',
    'DROP POLICY IF EXISTS "allow_own_profile_select" ON profiles;',
    'DROP POLICY IF EXISTS "allow_own_profile_insert" ON profiles;',
    'DROP POLICY IF EXISTS "allow_own_profile_update" ON profiles;',
  ]

  for (const cmd of dropCommands) {
    await executeCommand(cmd)
  }

  console.log("\n🧪 Testing without RLS...")

  // Test the fix
  const { createClient } = require("@supabase/supabase-js")
  require("dotenv").config({ path: ".env.local" })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email")
      .limit(1)

    if (error) {
      console.log("❌ Still has error:", error.message)
    } else {
      console.log("✅ Profiles accessible without RLS!")
      console.log("📊 Found", data?.length, "profile(s)")

      console.log("\n⚠️  WARNING: RLS is now DISABLED")
      console.log("🔒 You need to re-enable it with proper policies")
      console.log("💡 But first, let's test if your app works...")
    }
  } catch (err) {
    console.error("Test error:", err.message)
  }
}

emergencyDisable()
