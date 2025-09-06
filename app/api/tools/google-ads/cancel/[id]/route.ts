import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Helper function to check authentication and get user
async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Authentication required", status: 401 }
  }

  return { user, supabase }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser()
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user, supabase } = authResult
    const { id } = await params

    // Check if analysis exists and belongs to user
    const { data: analysis, error: analysisError } = await supabase
      .from("dataforseo_analyses")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
    }

    // Check if analysis can be cancelled
    if (analysis.status === "completed" || analysis.status === "failed") {
      return NextResponse.json(
        { error: "Analysis cannot be cancelled" },
        { status: 400 }
      )
    }

    // Update analysis status to cancelled
    const { error: updateError } = await supabase
      .from("dataforseo_analyses")
      .update({
        status: "cancelled",
        completed_at: new Date().toISOString(),
        error_message: "Analysis cancelled by user",
      })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to cancel analysis" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Analysis cancelled successfully",
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
