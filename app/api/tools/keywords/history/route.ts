import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth-utils"

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

    // Transform data to match frontend interface
    const transformedAnalyses =
      analyses?.map((analysis) => {
        const results = analysis.analysis_results || {}

        return {
          id: analysis.id,
          status: analysis.status,
          progress: analysis.progress,
          totalKeywords: analysis.total_keywords || 0,
          rankedKeywords: results.ranked_keywords_count || 0,
          opportunities: results.suggestions_count || 0,
          cost: parseFloat(analysis.dataforseo_cost || "0"),
          keywords: results.keywords || [],
          created_at: analysis.created_at,
          completed_at: analysis.completed_at,
          websiteName:
            (analysis.user_websites as any)?.name ||
            (analysis.user_websites as any)?.url ||
            "Unknown",
        }
      }) || []

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
