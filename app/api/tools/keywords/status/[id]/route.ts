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

    // Get analysis with FULL JSON responses
    const { data: analysis, error: analysisError } = await supabase
      .from("dataforseo_analyses")
      .select(
        `
        *,
        ranked_keywords_response,
        keyword_suggestions_response
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

    // If analysis is completed, include FULL results with all data
    if (
      analysis.status === "completed" &&
      (analysis.ranked_keywords_response ||
        analysis.keyword_suggestions_response)
    ) {
      let allKeywords: any[] = []

      // Process ranked keywords with FULL data
      if (analysis.ranked_keywords_response?.[0]?.items) {
        const rankedItems = analysis.ranked_keywords_response[0].items

        const rankedKeywords = rankedItems.map((item: any) => {
          const keywordData = item.keyword_data
          const serpItem = item.ranked_serp_element?.serp_item

          return {
            keyword: keywordData.keyword,
            type: "ranked",
            searchVolume: keywordData.keyword_info?.search_volume || 0,
            difficulty:
              keywordData.keyword_properties?.keyword_difficulty ||
              item.ranked_serp_element?.keyword_difficulty ||
              0,
            cpc: keywordData.keyword_info?.cpc || 0,
            competition: keywordData.keyword_info?.competition || 0,
            competitionLevel:
              keywordData.keyword_info?.competition_level || "UNKNOWN",
            position: serpItem?.rank_absolute || null,
            previousPosition:
              serpItem?.rank_changes?.previous_rank_absolute || null,
            isUp: serpItem?.rank_changes?.is_up || false,
            isDown: serpItem?.rank_changes?.is_down || false,
            isNew: serpItem?.rank_changes?.is_new || false,
            url: serpItem?.url || null,
            title: serpItem?.title || null,
            description: serpItem?.description || null,
            domain: serpItem?.domain || null,
            intent: keywordData.search_intent_info?.main_intent || "unknown",
            foreignIntent: keywordData.search_intent_info?.foreign_intent || [],
            monthlySearches: keywordData.keyword_info?.monthly_searches || [],
            trends: keywordData.keyword_info?.search_volume_trend || {},
            etv: serpItem?.etv || 0,
            estimatedPaidCost: serpItem?.estimated_paid_traffic_cost || 0,
            backlinks: serpItem?.backlinks_info || null,
            serpFeatures: keywordData.serp_info?.serp_item_types || [],
            categories: keywordData.keyword_info?.categories || [],
            lastUpdated:
              keywordData.keyword_info?.last_updated_time ||
              keywordData.serp_info?.last_updated_time,
          }
        })

        allKeywords = [...allKeywords, ...rankedKeywords]
      }

      // Process keyword suggestions with full data
      if (analysis.keyword_suggestions_response?.[0]?.items) {
        const suggestionItems = analysis.keyword_suggestions_response[0].items

        const suggestions = suggestionItems.map((item: any) => ({
          keyword: item.keyword_data?.keyword || item.keyword,
          type: "suggestion",
          searchVolume: item.keyword_data?.search_volume || 0,
          difficulty: item.keyword_data?.keyword_difficulty || 0,
          cpc: item.keyword_data?.cpc || 0,
          competition: item.keyword_data?.competition || 0,
          competitionLevel: item.keyword_data?.competition_level || "UNKNOWN",
          position: null,
          intent: item.search_intent_info?.main_intent || "unknown",
          monthlySearches: item.keyword_data?.monthly_searches || [],
          trends: item.keyword_data?.search_volume_trend || {},
          serpFeatures: [],
          categories: item.keyword_data?.categories || [],
        }))

        allKeywords = [...allKeywords, ...suggestions]
      }

      const rankedCount = allKeywords.filter(
        (k: any) => k.type === "ranked"
      ).length
      const suggestionCount = allKeywords.filter(
        (k: any) => k.type === "suggestion"
      ).length

      response.results = {
        id: analysis.id,
        totalKeywords: allKeywords.length,
        rankedKeywords: rankedCount,
        opportunities: suggestionCount,
        cost: analysis.dataforseo_cost || 0,
        keywords: allKeywords,
        // Additional rich data
        summary: {
          avgSearchVolume:
            Math.round(
              allKeywords.reduce(
                (sum: number, k: any) => sum + k.searchVolume,
                0
              ) / allKeywords.length
            ) || 0,
          avgCpc:
            Math.round(
              (allKeywords.reduce((sum: number, k: any) => sum + k.cpc, 0) /
                allKeywords.length) *
                100
            ) / 100 || 0,
          avgPosition:
            Math.round(
              allKeywords
                .filter((k: any) => k.position)
                .reduce(
                  (sum: number, k: any, _: any, arr: any[]) =>
                    sum + (k.position || 0) / arr.length,
                  0
                )
            ) || 0,
          totalEtv:
            Math.round(
              allKeywords.reduce((sum: number, k: any) => sum + k.etv, 0) * 100
            ) / 100,
          intentDistribution: allKeywords.reduce((acc: any, k: any) => {
            acc[k.intent] = (acc[k.intent] || 0) + 1
            return acc
          }, {}),
        },
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
