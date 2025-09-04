import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addTestWebsite() {
  console.log("Adding test website for admin@marion.com...\n")

  // Get admin@marion.com user ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "admin@marion.com")
    .single()

  if (profileError || !profile) {
    console.error("Error finding user:", profileError)
    return
  }

  console.log("Found user ID:", profile.id)

  // Add test website
  const { data: website, error: websiteError } = await supabase
    .from("user_websites")
    .insert({
      user_id: profile.id,
      url: "https://quartiermetta.com",
      name: "Quartier Metta",
      business_type: "service",
      target_countries: ["FR", "CA"],
      site_languages: ["fr", "en"],
      industry: "Service",
      is_primary: true,
    })
    .select()
    .single()

  if (websiteError) {
    console.error("Error adding website:", websiteError)
    return
  }

  console.log("Website added successfully:", website)

  // Check updated quota
  const { data: quotaInfo } = await supabase
    .from("user_website_quotas")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle()

  console.log("Updated quota:", quotaInfo)
}

addTestWebsite().catch(console.error)
