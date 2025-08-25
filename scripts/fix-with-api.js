const https = require("https")
const fs = require("fs")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

// Extract project ID from URL
const projectId = supabaseUrl
  .replace("https://", "")
  .replace(".supabase.co", "")

async function executeSQL() {
  console.log("🔧 Fixing RLS policies via Management API...")

  const sqlScript = `
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- Create new simple policies
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Fix trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at, role, preferred_language)
  VALUES (
    new.id, 
    new.email,
    now(),
    now(),
    'subscriber',
    'fr'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `.trim()

  const postData = JSON.stringify({
    query: sqlScript,
  })

  const options = {
    hostname: `${projectId}.supabase.co`,
    port: 443,
    path: "/rest/v1/rpc/exec",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseServiceKey}`,
      apikey: supabaseServiceKey,
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
        console.log("Response status:", res.statusCode)
        console.log("Response:", data)

        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log("✅ SQL executed successfully!")
        } else {
          console.error("❌ Error executing SQL:", data)
        }
        resolve(data)
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

// Alternative approach: Use direct PostgreSQL connection string if available
async function tryDirectConnection() {
  console.log("💡 Trying alternative approach...")
  console.log("📝 Please execute this SQL manually in your Supabase dashboard:")
  console.log("=".repeat(60))

  const sqlContent = fs.readFileSync("supabase/fix-rls-policies.sql", "utf8")
  console.log(sqlContent)

  console.log("=".repeat(60))
  console.log(
    `🔗 Go to: ${supabaseUrl.replace("//", "//app.")}/project/${projectId.split("-")[0]}/sql/new`
  )
  console.log("📋 Copy the SQL above and execute it in the SQL Editor")
}

// Execute both approaches
executeSQL().catch(() => {
  tryDirectConnection()
})
