const https = require("https")

const token = "sbp_95cea2145b4da37efedb43ce94ffc10b7108f467"
const projectRef = "ypygrfrwpddqjbahgayc"

const sqlScript = `
-- Fix infinite recursion in profiles RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, role, preferred_language, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, 'subscriber', 'fr', NOW(), NOW()
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`

async function executeSQL() {
  console.log("🔧 Executing RLS fix with management token...")

  const postData = JSON.stringify({
    query: sqlScript,
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
        console.log("Response status:", res.statusCode)
        console.log("Response headers:", res.headers)
        console.log("Response body:", data)

        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log("✅ SQL executed successfully!")
        } else {
          console.error("❌ Error executing SQL")
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

executeSQL().catch(console.error)
