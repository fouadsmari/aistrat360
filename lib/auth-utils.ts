import { createSupabaseClient } from "./supabase"

/**
 * Refresh user session and profile data
 * Useful after profile updates that might affect permissions
 */
export async function refreshUserSession() {
  try {
    const supabase = createSupabaseClient()

    // Force refresh the session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.refreshSession()

    if (sessionError) {
      return { success: false, error: sessionError }
    }

    // Refetch user profile to ensure latest data
    if (sessionData.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionData.user.id)
        .single()

      if (profileError) {
        return { success: false, error: profileError }
      }

      return { success: true, user: sessionData.user, profile }
    }

    return { success: true, user: sessionData.user, profile: null }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Sign out and redirect to login
 */
export async function signOutUser() {
  try {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  } catch (error) {
    window.location.href = "/login"
  }
}
