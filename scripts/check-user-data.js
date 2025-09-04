import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUserData() {
  console.log("Checking user data...\n")

  // Check all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, role")
    .limit(5)

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError)
    return
  }

  console.log("Profiles found:", profiles.length)
  profiles.forEach((profile) => {
    console.log(`  - ${profile.email} (${profile.role})`)
  })
  console.log()

  // Check user websites for each profile
  for (const profile of profiles) {
    const { data: websites, error: websitesError } = await supabase
      .from("user_websites")
      .select("*")
      .eq("user_id", profile.id)

    if (websitesError) {
      console.error(
        `Error fetching websites for ${profile.email}:`,
        websitesError
      )
      continue
    }

    console.log(`Websites for ${profile.email}:`, websites.length)
    websites.forEach((website) => {
      console.log(`  - ${website.name || "Unnamed"}: ${website.url}`)
    })

    // Check quota info from view
    const { data: quotaInfo, error: quotaError } = await supabase
      .from("user_website_quotas")
      .select("*")
      .eq("user_id", profile.id)
      .maybeSingle()

    if (quotaError) {
      console.error(`Error fetching quota for ${profile.email}:`, quotaError)
    } else if (quotaInfo) {
      console.log(
        `  Quota: ${quotaInfo.websites_used}/${quotaInfo.websites_limit} (plan: ${quotaInfo.plan})`
      )
    } else {
      console.log(`  Quota: Not found in view`)
    }
    console.log()
  }
}

checkUserData().catch(console.error)
