import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { DataForSEOClient } from "@/lib/dataforseo-client"

// Validation schema for analysis request
const analysisSchema = z.object({
  websiteId: z.string().uuid("Invalid website ID"),
  country: z.string().optional().default("FR"),
  language: z.string().optional().default("fr"),
})

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

// Helper function to update analysis progress
async function updateProgress(
  supabase: any,
  analysisId: string,
  progress: number,
  status?: string
) {
  await supabase.rpc("update_analysis_progress", {
    analysis_uuid: analysisId,
    new_progress: progress,
    new_status: status || null,
  })
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser()
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user, supabase } = authResult

    // Parse and validate request body
    const body = await request.json()
    const validationResult = analysisSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { websiteId, country, language } = validationResult.data

    // Get website details
    const { data: website, error: websiteError } = await supabase
      .from("user_websites")
      .select("*")
      .eq("id", websiteId)
      .eq("user_id", user.id)
      .single()

    if (websiteError || !website) {
      return NextResponse.json(
        { error: "Website not found or access denied" },
        { status: 404 }
      )
    }

    // Check if user has quota for analyses
    // TODO: Add quota checking logic here based on user subscription

    // Create analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from("dataforseo_analyses")
      .insert({
        user_id: user.id,
        website_id: websiteId,
        analysis_type: "keyword_analysis",
        status: "pending",
        progress: 0,
        input_data: {
          country,
          language,
          limit: 900,
        },
      })
      .select()
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: "Failed to create analysis" },
        { status: 500 }
      )
    }

    // Start background analysis process
    performAnalysisInBackground(analysis.id, website, country, language)

    return NextResponse.json(
      {
        analysisId: analysis.id,
        message: "Analysis started successfully",
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Background analysis function
async function performAnalysisInBackground(
  analysisId: string,
  website: any,
  country: string,
  language: string
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const dataforSEO = new DataForSEOClient()

  try {
    // Update status to processing
    await updateProgress(supabase, analysisId, 10, "processing")

    // Step 1: Get page content for keyword extraction (20%)
    await updateProgress(supabase, analysisId, 20)
    const pageContent = await dataforSEO.getWebsiteHTML(website.url)

    // Step 2: Get ranked keywords (50%)
    await updateProgress(supabase, analysisId, 40)
    const domain = new URL(website.url).hostname
    const rankedKeywords = await dataforSEO.getRankedKeywords(
      domain,
      country,
      900
    )

    // Step 3: Extract seed keywords and get suggestions (70%)
    await updateProgress(supabase, analysisId, 60)
    const seedKeywords = dataforSEO.extractMainKeywords(
      { tasks: [{ result: [{ items: [{ meta: { title: website.name } }] }] }] },
      10
    )
    const keywordSuggestions = await dataforSEO.getKeywordSuggestions(
      seedKeywords,
      country,
      100
    )

    // Step 4: Process and save results (90%)
    await updateProgress(supabase, analysisId, 80)

    const allKeywords = []

    // Process ranked keywords - Extract items from DataForSEO result
    const allRankedItems = []

    // Extract all items from the result objects
    for (const result of rankedKeywords) {
      if (result.items && Array.isArray(result.items)) {
        allRankedItems.push(...result.items)
      }
    }

    for (const item of allRankedItems) {
      // Defensive programming: try multiple possible structures
      let keyword = null
      let keywordData = null

      if (item.keyword_data?.keyword) {
        // Standard DataForSEO structure
        keyword = item.keyword_data.keyword
        keywordData = item.keyword_data
      } else if (item.keyword) {
        // Alternative structure
        keyword = item.keyword
        keywordData = item
      }

      if (keyword) {
        allKeywords.push({
          analysis_id: analysisId,
          keyword: keyword,
          keyword_type: "ranked",
          search_volume:
            keywordData.keyword_info?.search_volume ||
            keywordData.search_volume ||
            0,
          keyword_difficulty:
            keywordData.keyword_info?.keyword_difficulty ||
            keywordData.keyword_difficulty ||
            0,
          cpc: keywordData.keyword_info?.cpc || keywordData.cpc || 0,
          competition:
            keywordData.keyword_info?.competition ||
            keywordData.competition ||
            0,
          current_position:
            item.ranked_serp_element?.serp_item?.rank_absolute ||
            item.position ||
            null,
          url: item.ranked_serp_element?.serp_item?.url || item.url || null,
        })
      }
    }

    // Process keyword suggestions
    for (const item of keywordSuggestions) {
      if (item.keyword_data?.keyword) {
        allKeywords.push({
          analysis_id: analysisId,
          keyword: item.keyword_data.keyword,
          keyword_type: "suggestion",
          search_volume: item.keyword_data.search_volume || 0,
          keyword_difficulty: item.keyword_data.keyword_difficulty || 0,
          cpc: item.keyword_data.cpc || 0,
          competition: item.keyword_data.competition || 0,
        })
      }
    }

    // Save keywords to database
    if (allKeywords.length > 0) {
      const { error: keywordsError } = await supabase
        .from("dataforseo_keywords")
        .insert(allKeywords)

      if (keywordsError) {
        throw new Error(`Failed to save keywords: ${keywordsError.message}`)
      }
    }

    // Calculate cost
    const cost = dataforSEO.calculateLabsCost(
      rankedKeywords.length,
      keywordSuggestions.length > 0 ? 1 : 0
    )

    // Update analysis with results
    const { error: updateError } = await supabase
      .from("dataforseo_analyses")
      .update({
        status: "completed",
        progress: 100,
        ranked_keywords_response: rankedKeywords,
        keyword_suggestions_response: keywordSuggestions,
        html_content_response: { content: pageContent },
        analysis_results: {
          totalKeywords: allKeywords.length,
          rankedKeywords: rankedKeywords.length,
          opportunities: keywordSuggestions.length,
          avgPosition: allKeywords
            .filter((k) => k.current_position)
            .reduce(
              (sum, k, _, arr) => sum + (k.current_position || 0) / arr.length,
              0
            ),
        },
        dataforseo_cost: cost,
        total_keywords: allKeywords.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", analysisId)

    if (updateError) {
      throw new Error(`Failed to update analysis: ${updateError.message}`)
    }

    await updateProgress(supabase, analysisId, 100, "completed")
  } catch (error: any) {
    // Update analysis with error
    await supabase
      .from("dataforseo_analyses")
      .update({
        status: "failed",
        error_message: error.message || "Unknown error occurred",
        completed_at: new Date().toISOString(),
      })
      .eq("id", analysisId)
  }
}
