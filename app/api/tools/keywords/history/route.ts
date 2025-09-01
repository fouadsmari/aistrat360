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

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser()
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user, supabase } = authResult

    // Get user's analysis history with website details
    const { data: analyses, error } = await supabase
      .from("dataforseo_analyses")
      .select(
        `
        id,
        status,
        progress,
        created_at,
        completed_at,
        total_keywords,
        dataforseo_cost,
        analysis_results,
        user_websites!inner(
          id,
          name,
          url
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch analysis history" },
        { status: 500 }
      )
    }

    // Get keywords for each analysis
    const transformedAnalyses = await Promise.all(
      analyses?.map(async (analysis) => {
        // Get keywords for this analysis
        const { data: keywords } = await supabase
          .from("dataforseo_keywords")
          .select("*")
          .eq("analysis_id", analysis.id)

        const formattedKeywords =
          keywords?.map((kw: any) => ({
            keyword: kw.keyword,
            type: kw.keyword_type === "ranked" ? "ranked" : "suggestion",
            searchVolume: kw.search_volume || 0,
            difficulty: kw.keyword_difficulty || 0,
            cpc: kw.cpc || 0,
            position: kw.current_position,
            url: kw.url,
          })) || []

        const rankedCount = formattedKeywords.filter(
          (k: any) => k.type === "ranked"
        ).length
        const suggestionCount = formattedKeywords.filter(
          (k: any) => k.type === "suggestion"
        ).length

        return {
          id: analysis.id,
          status: analysis.status,
          progress: analysis.progress,
          totalKeywords: formattedKeywords.length,
          rankedKeywords: rankedCount,
          opportunities: suggestionCount,
          cost: parseFloat(analysis.dataforseo_cost || "0"),
          keywords: formattedKeywords,
          created_at: analysis.created_at,
          completed_at: analysis.completed_at,
          websiteName:
            (analysis.user_websites as any)?.name ||
            (analysis.user_websites as any)?.url ||
            "Unknown",
        }
      }) || []
    )

    return NextResponse.json({
      analyses: transformedAnalyses,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
