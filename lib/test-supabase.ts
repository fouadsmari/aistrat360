import { supabase, supabaseAdmin } from "./supabase"

export async function testSupabaseConnection() {
  try {
    // Test client connection
    console.log("🔍 Testing Supabase client connection...")
    const { data, error } = await supabase.from("_test").select("*").limit(1)

    if (error && error.code !== "PGRST116") {
      console.log("❌ Client connection error:", error.message)
    } else {
      console.log("✅ Supabase client connection successful")
    }

    // Test admin connection
    console.log("🔍 Testing Supabase admin connection...")
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("_test")
      .select("*")
      .limit(1)

    if (adminError && adminError.code !== "PGRST116") {
      console.log("❌ Admin connection error:", adminError.message)
    } else {
      console.log("✅ Supabase admin connection successful")
    }

    return { success: true }
  } catch (error) {
    console.log("❌ Connection test failed:", error)
    return { success: false, error }
  }
}
