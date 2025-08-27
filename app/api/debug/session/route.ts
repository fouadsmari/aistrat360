import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"

// Service role client pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    // Check current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({
        error: "Session error",
        details: sessionError,
      })
    }

    if (!session) {
      return NextResponse.json({
        status: "no_session",
        message: "No active session found",
      })
    }

    // Try to get profile with regular client
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    // Also try with admin client
    const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    return NextResponse.json({
      session_user_id: session.user.id,
      session_email: session.user.email,
      profile_with_user_client: {
        data: profile,
        error: profileError?.message,
      },
      profile_with_admin_client: {
        data: adminProfile,
        error: adminProfileError?.message,
      },
      debug_info: {
        timestamp: new Date().toISOString(),
        session_expires_at: session.expires_at,
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: "Debug error",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
