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

export async function GET(
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

    // Get analysis with keywords
    const { data: analysis, error: analysisError } = await supabase
      .from("dataforseo_analyses")
      .select(
        `
        *,
        dataforseo_keywords(*)
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
    }

    // Prepare response based on status
    const response: any = {
      id: analysis.id,
      status: analysis.status,
      progress: analysis.progress,
      error: analysis.error_message || null,
      createdAt: analysis.created_at,
      startedAt: analysis.started_at,
      completedAt: analysis.completed_at,
    }

    // If analysis is completed, include results
    if (analysis.status === "completed" && analysis.dataforseo_keywords) {
      const keywords = analysis.dataforseo_keywords.map((kw: any) => ({
        keyword: kw.keyword,
        type: kw.keyword_type,
        searchVolume: kw.search_volume,
        difficulty: kw.keyword_difficulty,
        cpc: kw.cpc,
        position: kw.current_position,
        url: kw.url,
      }))

      const rankedKeywords = keywords.filter((k: any) => k.type === "ranked")
      const suggestions = keywords.filter((k: any) => k.type === "suggestion")

      response.results = {
        id: analysis.id,
        totalKeywords: keywords.length,
        rankedKeywords: rankedKeywords.length,
        opportunities: suggestions.length,
        cost: analysis.dataforseo_cost || 0,
        keywords: keywords,
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error(
      "Unexpected error in GET /api/tools/dataforseo/status:",
      error
    )
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
