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

    // Get analysis with complete JSON responses
    const { data: analysis, error: analysisError } = await supabase
      .from("dataforseo_analyses")
      .select(`
        id,
        ranked_keywords_response,
        keyword_suggestions_response,
        html_content_response,
        user_websites!inner(
          id,
          name,
          url
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
    }

    // Process ranked keywords with full details
    const rankedKeywords = analysis.ranked_keywords_response?.[0]?.items || []
    const processedKeywords = rankedKeywords.map((item: any) => {
      const keywordData = item.keyword_data
      const serpItem = item.ranked_serp_element?.serp_item
      
      return {
        keyword: keywordData.keyword,
        searchVolume: keywordData.keyword_info?.search_volume || 0,
        cpc: keywordData.keyword_info?.cpc || 0,
        competition: keywordData.keyword_info?.competition || 0,
        competitionLevel: keywordData.keyword_info?.competition_level || "UNKNOWN",
        difficulty: keywordData.keyword_properties?.keyword_difficulty || item.ranked_serp_element?.keyword_difficulty || 0,
        intent: keywordData.search_intent_info?.main_intent || "unknown",
        foreignIntent: keywordData.search_intent_info?.foreign_intent || [],
        
        // Historical data
        monthlySearches: keywordData.keyword_info?.monthly_searches || [],
        trends: keywordData.keyword_info?.search_volume_trend || {},
        
        // SERP data
        currentPosition: serpItem?.rank_absolute || null,
        previousPosition: serpItem?.rank_changes?.previous_rank_absolute || null,
        isUp: serpItem?.rank_changes?.is_up || false,
        isDown: serpItem?.rank_changes?.is_down || false,
        isNew: serpItem?.rank_changes?.is_new || false,
        
        // Page details
        url: serpItem?.url || null,
        title: serpItem?.title || null,
        description: serpItem?.description || null,
        domain: serpItem?.domain || null,
        
        // Value metrics
        etv: serpItem?.etv || 0, // Estimated Traffic Value
        estimatedPaidCost: serpItem?.estimated_paid_traffic_cost || 0,
        
        // Backlinks info
        backlinks: serpItem?.backlinks_info || null,
        
        // Additional SERP features
        serpFeatures: keywordData.serp_info?.serp_item_types || [],
        
        // Categories
        categories: keywordData.keyword_info?.categories || [],
        
        // Last updated
        lastUpdated: keywordData.keyword_info?.last_updated_time || keywordData.serp_info?.last_updated_time
      }
    })

    // Extract competitors (domains that appear multiple times)
    const competitorDomains = new Map<string, any>()
    
    rankedKeywords.forEach((item: any) => {
      const serpItem = item.ranked_serp_element?.serp_item
      const websiteUrl = (analysis.user_websites as any)?.url
      if (serpItem?.domain && websiteUrl && serpItem.domain !== websiteUrl.replace(/^https?:\/\//, '')) {
        const domain = serpItem.domain
        
        if (!competitorDomains.has(domain)) {
          competitorDomains.set(domain, {
            domain,
            websiteName: serpItem.website_name || domain,
            appearances: 0,
            avgPosition: 0,
            totalEtv: 0,
            backlinks: serpItem.backlinks_info || null,
            keywords: []
          })
        }
        
        const competitor = competitorDomains.get(domain)!
        competitor.appearances += 1
        competitor.avgPosition = (competitor.avgPosition * (competitor.appearances - 1) + (serpItem.rank_absolute || 0)) / competitor.appearances
        competitor.totalEtv += serpItem.etv || 0
        competitor.keywords.push({
          keyword: item.keyword_data.keyword,
          position: serpItem.rank_absolute,
          etv: serpItem.etv
        })
      }
    })

    // Sort competitors by appearances (top 5)
    const topCompetitors = Array.from(competitorDomains.values())
      .sort((a, b) => b.appearances - a.appearances)
      .slice(0, 5)
      .map(comp => ({
        ...comp,
        avgPosition: Math.round(comp.avgPosition),
        totalEtv: Math.round(comp.totalEtv * 100) / 100
      }))

    // Process keyword suggestions
    const suggestions = analysis.keyword_suggestions_response?.[0]?.items || []
    const processedSuggestions = suggestions.map((item: any) => ({
      keyword: item.keyword_data?.keyword || item.keyword,
      searchVolume: item.keyword_data?.search_volume || 0,
      cpc: item.keyword_data?.cpc || 0,
      competition: item.keyword_data?.competition || 0,
      difficulty: item.keyword_data?.keyword_difficulty || 0,
      intent: item.search_intent_info?.main_intent || "unknown"
    }))

    return NextResponse.json({
      id: analysis.id,
      website: analysis.user_websites,
      rankedKeywords: processedKeywords,
      suggestions: processedSuggestions,
      competitors: topCompetitors,
      totalKeywords: processedKeywords.length,
      totalSuggestions: processedSuggestions.length,
      summary: {
        avgSearchVolume: Math.round(processedKeywords.reduce((sum: number, k: any) => sum + k.searchVolume, 0) / processedKeywords.length) || 0,
        avgCpc: Math.round(processedKeywords.reduce((sum: number, k: any) => sum + k.cpc, 0) / processedKeywords.length * 100) / 100 || 0,
        avgPosition: Math.round(processedKeywords.filter((k: any) => k.currentPosition).reduce((sum: number, k: any, _: any, arr: any[]) => sum + (k.currentPosition || 0) / arr.length, 0)) || 0,
        totalEtv: Math.round(processedKeywords.reduce((sum: number, k: any) => sum + k.etv, 0) * 100) / 100,
        totalPaidValue: Math.round(processedKeywords.reduce((sum: number, k: any) => sum + k.estimatedPaidCost, 0) * 100) / 100
      }
    })

  } catch (error: any) {
    console.error("Error fetching detailed analysis:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}