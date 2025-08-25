const https = require("https")

const token = "sbp_95cea2145b4da37efedb43ce94ffc10b7108f467"
const projectRef = "ypygrfrwpddqjbahgayc"

// More aggressive approach - disable RLS temporarily then recreate properly
const commands = [
  // Step 1: Completely disable RLS temporarily
  "ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;",

  // Step 2: Drop ALL policies
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

  // Step 3: Create ONE simple policy at a time
  'CREATE POLICY "allow_own_profile_select" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);',

  // Step 4: Re-enable RLS
  "ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;",

  // Step 5: Test that it works, then add other policies
  'CREATE POLICY "allow_own_profile_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);',
  'CREATE POLICY "allow_own_profile_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);',
]

async function executeCommand(command, index) {
  console.log(
    `\n🔧 [${index + 1}/${commands.length}] Executing: ${command.substring(0, 60)}...`
  )

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

async function nuclearFix() {
  console.log("🚨 NUCLEAR OPTION: Complete RLS rebuild")
  console.log("=====================================")

  for (let i = 0; i < commands.length; i++) {
    try {
      await executeCommand(commands[i], i)

      // Small delay between commands
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`❌ Failed at command ${i + 1}:`, error)
      break
    }
  }

  console.log("\n🧪 Testing the fix...")

  // Wait a bit for changes to propagate
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Test the fix
  const { createClient } = require("@supabase/supabase-js")
  require("dotenv").config({ path: ".env.local" })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)

    if (error && error.code === "42P17") {
      console.log("❌ Recursion still present")
    } else {
      console.log("✅ RLS recursion appears to be FIXED!")
    }
  } catch (err) {
    console.error("Test error:", err.message)
  }
}

nuclearFix()
