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
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10"))
    )
    const websiteId = searchParams.get("website_id") || ""
    const status = searchParams.get("status") || ""

    const offset = (page - 1) * limit

    // Build query with filters
    let query = supabase
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
      `,
        { count: "exact" }
      )
      .eq("user_id", user.id)

    // Apply filters
    if (websiteId) {
      query = query.eq("website_id", websiteId)
    }

    if (
      status &&
      ["pending", "processing", "completed", "failed"].includes(status)
    ) {
      query = query.eq("status", status)
    }

    // Apply pagination and ordering
    const {
      data: analyses,
      error,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch analysis history" },
        { status: 500 }
      )
    }

    // Get keywords with FULL JSON data for each analysis
    const transformedAnalyses = await Promise.all(
      analyses?.map(async (analysis) => {
        // Get FULL JSON responses instead of simplified table
        const { data: fullAnalysis } = await supabase
          .from("dataforseo_analyses")
          .select("ranked_keywords_response, keyword_suggestions_response")
          .eq("id", analysis.id)
          .single()

        let formattedKeywords: any[] = []

        // Process ranked keywords with FULL data
        if (fullAnalysis?.ranked_keywords_response?.[0]?.items) {
          const rankedItems = fullAnalysis.ranked_keywords_response[0].items

          formattedKeywords = rankedItems.map((item: any) => {
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
              foreignIntent:
                keywordData.search_intent_info?.foreign_intent || [],
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
        }

        // Add keyword suggestions with full data
        if (fullAnalysis?.keyword_suggestions_response?.[0]?.items) {
          const suggestionItems =
            fullAnalysis.keyword_suggestions_response[0].items

          const suggestionKeywords = suggestionItems.map((item: any) => ({
            keyword: item.keyword || item.keyword_data?.keyword,
            type: "suggestion",
            searchVolume:
              item.keyword_info?.search_volume ||
              item.keyword_data?.search_volume ||
              0,
            difficulty:
              item.keyword_properties?.keyword_difficulty ||
              item.keyword_data?.keyword_difficulty ||
              0,
            cpc: item.keyword_info?.cpc || item.keyword_data?.cpc || 0,
            competition:
              item.keyword_info?.competition ||
              item.keyword_data?.competition ||
              0,
            competitionLevel:
              item.keyword_info?.competition_level ||
              item.keyword_data?.competition_level ||
              "UNKNOWN",
            position: null,
            intent: item.search_intent_info?.main_intent || "unknown",
            monthlySearches:
              item.keyword_info?.monthly_searches ||
              item.keyword_data?.monthly_searches ||
              [],
            trends:
              item.keyword_info?.search_volume_trend ||
              item.keyword_data?.search_volume_trend ||
              {},
            serpFeatures: item.serp_info?.serp_item_types || [],
            categories:
              item.keyword_info?.categories ||
              item.keyword_data?.categories ||
              [],
          }))

          formattedKeywords = [...formattedKeywords, ...suggestionKeywords]
        }

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

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      analyses: transformedAnalyses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        website_id: websiteId,
        status,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
