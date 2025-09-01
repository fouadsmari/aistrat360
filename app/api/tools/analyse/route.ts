import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ProfitabilityPredictor } from "@/lib/profitability-predictor"
import { z } from "zod"

const analyseRequestSchema = z.object({
  websiteUrl: z.string().url(),
  budget: z.number().min(100).max(100000),
  objective: z.enum(["leads", "sales", "traffic", "awareness"]),
  targetCountry: z.enum([
    "CA",
    "US",
    "FR",
    "BE",
    "CH",
    "GB",
    "DE",
    "ES",
    "IT",
    "NL",
  ]),
  keywords: z.string().optional(),
})

export async function POST(request: NextRequest) {
  console.log(
    `🔵 [API] POST /api/tools/analyse - Request received at ${new Date().toISOString()}`
  )

  try {
    console.log(`🔵 [API] Creating Supabase client...`)
    const supabase = await createSupabaseServerClient()
    console.log(`✅ [API] Supabase client created`)

    // Check authentication
    console.log(`🔵 [API] Checking authentication...`)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error(`❌ [API] Authentication failed:`, authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log(`✅ [API] User authenticated: ${user.id}`)

    // Validate request body
    console.log(`🔵 [API] Parsing request body...`)
    const body = await request.json()
    console.log(`📝 [API] Raw body received:`, JSON.stringify(body, null, 2))

    console.log(`🔵 [API] Validating input data...`)
    const validatedData = analyseRequestSchema.parse(body)
    console.log(
      `✅ [API] Input validated:`,
      JSON.stringify(validatedData, null, 2)
    )

    // Check user quota - Fixed to use subscriptions table correctly
    console.log(`🔵 [API] Checking user subscription...`)
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single()

    if (subError) {
      console.log(
        `⚠️ [API] No subscription found for user (might be free plan):`,
        subError
      )
    } else {
      console.log(`📝 [API] Subscription found:`, subscription)
    }

    let monthlyLimit = 3 // Default for free plan
    console.log(`🔵 [API] Default monthly limit: ${monthlyLimit}`)

    if (subscription) {
      // Get the subscription pack details based on plan name
      console.log(
        `🔵 [API] Fetching pack details for plan: ${subscription.plan}`
      )
      const { data: pack, error: packError } = await supabase
        .from("subscription_packs")
        .select("analyses_per_month")
        .eq("name", subscription.plan)
        .single()

      if (packError) {
        console.error(`❌ [API] Pack fetch error:`, packError)
      } else {
        console.log(`📝 [API] Pack data:`, pack)
      }

      monthlyLimit = pack?.analyses_per_month || 3
      console.log(
        `📊 [API] User ${user.email} has plan: ${subscription.plan}, limit: ${monthlyLimit}`
      )
    } else {
      console.log(
        `📊 [API] User ${user.email} on free plan, limit: ${monthlyLimit}`
      )
    }

    // Get current month usage
    console.log(`🔵 [API] Calculating current month usage...`)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    console.log(`📝 [API] Start of month: ${startOfMonth.toISOString()}`)

    const { count: usedAnalyses, error: countError } = await supabase
      .from("profitability_analyses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString())

    if (countError) {
      console.error(`❌ [API] Count error:`, countError)
    }

    console.log(`📊 [API] Analyses used this month: ${usedAnalyses || 0}`)

    const isUnlimited = monthlyLimit === -1
    const remaining = isUnlimited
      ? 999
      : Math.max(0, monthlyLimit - (usedAnalyses || 0))

    console.log(`📊 [API] Quota status:`, {
      monthlyLimit,
      used: usedAnalyses || 0,
      remaining,
      isUnlimited,
    })

    if (!isUnlimited && remaining <= 0) {
      console.error(`❌ [API] Quota exceeded for user ${user.email}`)
      return NextResponse.json(
        { error: "Quota exceeded. Please upgrade your plan." },
        { status: 403 }
      )
    }

    // Create profitability analysis record
    console.log(`🔵 [API] Creating analysis record in database...`)
    const analysisData = {
      user_id: user.id,
      analysis_type: "profitability_prediction",
      input_data: {
        websiteUrl: validatedData.websiteUrl,
        budget: validatedData.budget,
        objective: validatedData.objective,
        targetCountry: validatedData.targetCountry,
        keywords: validatedData.keywords || "",
      },
      status: "pending",
      progress: 0,
      credits_used: 2,
    }
    console.log(
      `📝 [API] Analysis data to insert:`,
      JSON.stringify(analysisData, null, 2)
    )

    const { data: analysis, error: insertError } = await supabase
      .from("profitability_analyses")
      .insert(analysisData)
      .select()
      .single()

    if (insertError || !analysis) {
      console.error(`❌ [API] Failed to create analysis:`, insertError)
      return NextResponse.json(
        { error: "Failed to create analysis" },
        { status: 500 }
      )
    }
    console.log(`✅ [API] Analysis record created with ID: ${analysis.id}`)

    // Process analysis synchronously instead of background for Vercel compatibility
    console.log(`🚀 [API] Starting synchronous analysis for ${analysis.id}`)
    console.log(`🔧 [API] Environment check:`)
    console.log(
      `  - DataForSEO Login: ${process.env.DATAFORSEO_LOGIN ? "SET ✅" : "NOT SET ❌"}`
    )
    console.log(
      `  - DataForSEO Password: ${process.env.DATAFORSEO_PASSWORD ? "SET ✅" : "NOT SET ❌"}`
    )
    console.log(
      `  - OpenAI API Key: ${process.env.OPENAI_API_KEY ? "SET ✅" : "NOT SET ❌"}`
    )
    console.log(
      `  - NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET ✅" : "NOT SET ❌"}`
    )
    console.log(
      `  - DATAFORSEO_CREDENTIALS: ${process.env.DATAFORSEO_CREDENTIALS ? "SET ✅" : "NOT SET ❌"}`
    )

    try {
      // Process the analysis directly in this request
      console.log(`🔵 [API] Calling processAnalysis function...`)
      console.log(`📝 [API] processAnalysis params:`, {
        analysisId: analysis.id,
        input: validatedData,
      })

      await processAnalysis(analysis.id, validatedData)

      console.log(
        `✅ [API] processAnalysis returned successfully for ${analysis.id}`
      )

      console.log(`🔵 [API] Preparing successful response...`)
      const successResponse = {
        success: true,
        analysisId: analysis.id,
        message: "Analysis completed successfully",
        status: "completed",
      }
      console.log(`📝 [API] Success response:`, successResponse)

      return NextResponse.json(successResponse)
    } catch (error) {
      console.error(`❌ [API] Analysis failed for ${analysis.id}:`, error)
      console.error(
        `❌ [API] Error stack trace:`,
        error instanceof Error ? error.stack : "No stack trace"
      )

      // Update analysis to failed status
      await supabase
        .from("profitability_analyses")
        .update({
          status: "failed",
          progress: 0,
          completed_at: new Date().toISOString(),
          result_data: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        })
        .eq("id", analysis.id)

      return NextResponse.json(
        {
          success: false,
          analysisId: analysis.id,
          message: "Analysis failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Analysis API error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint to check analysis status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get("id")

    if (!analysisId) {
      return NextResponse.json(
        { error: "Analysis ID is required" },
        { status: 400 }
      )
    }

    // Get analysis status
    const { data: analysis, error } = await supabase
      .from("profitability_analyses")
      .select("*")
      .eq("id", analysisId)
      .eq("user_id", user.id)
      .single()

    if (error || !analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: analysis.id,
      status: analysis.status,
      progress: analysis.progress,
      result_data: analysis.result_data,
      created_at: analysis.created_at,
      completed_at: analysis.completed_at,
    })
  } catch (error) {
    console.error("Analysis status API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Process analysis in background
 */
async function processAnalysis(
  analysisId: string,
  input: z.infer<typeof analyseRequestSchema>
) {
  console.log(`
${"=".repeat(80)}`)
  console.log(
    `🔷 [PROCESS] processAnalysis() called at ${new Date().toISOString()}`
  )
  console.log(`🔷 [PROCESS] Analysis ID: ${analysisId}`)
  console.log(`🔷 [PROCESS] Input:`, JSON.stringify(input, null, 2))
  console.log(`${"=".repeat(80)}\n`)

  console.log(`🔷 [PROCESS] Creating Supabase client...`)
  const supabase = await createSupabaseServerClient()
  console.log(`✅ [PROCESS] Supabase client created`)

  console.log(`🔷 [PROCESS] Creating ProfitabilityPredictor instance...`)
  const predictor = new ProfitabilityPredictor()
  console.log(`✅ [PROCESS] ProfitabilityPredictor created`)

  try {
    console.log(
      `🔷 [PROCESS] Starting analysis ${analysisId} for ${input.websiteUrl}`
    )

    // Update progress callback
    const updateProgress = async (progress: number, status: string) => {
      console.log(`📊 [PROGRESS] ${analysisId}: ${progress}% - ${status}`)

      const updateData = {
        progress,
        status: progress === 100 ? "completed" : "processing",
      }
      console.log(`🔷 [PROCESS] Updating DB with:`, updateData)

      const { error } = await supabase
        .from("profitability_analyses")
        .update(updateData)
        .eq("id", analysisId)

      if (error) {
        console.error(`❌ [PROCESS] Failed to update progress:`, error)
      } else {
        console.log(`✅ [PROCESS] Progress updated in DB`)
      }
    }

    // Start processing
    console.log(
      `🔷 [PROCESS] Calling updateProgress(5, "Initialisation de l'analyse...")...`
    )
    await updateProgress(5, "Initialisation de l'analyse...")
    console.log(`✅ [PROCESS] Initial progress update complete`)

    console.log(
      `🔷 [PROCESS] About to call predictor.predictProfitability()...`
    )
    console.log(`📝 [PROCESS] predictProfitability params:`, {
      websiteUrl: input.websiteUrl,
      budget: input.budget,
      objective: input.objective,
      targetCountry: input.targetCountry,
      keywords: input.keywords,
      analysisId: analysisId,
      hasUpdateCallback: true,
    })

    // Run prediction with timeout
    const prediction = (await Promise.race([
      predictor.predictProfitability(
        {
          websiteUrl: input.websiteUrl,
          budget: input.budget,
          objective: input.objective,
          targetCountry: input.targetCountry,
          keywords: input.keywords,
        },
        analysisId,
        updateProgress
      ),
      // 5 minute timeout
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Analysis timeout after 5 minutes")),
          5 * 60 * 1000
        )
      ),
    ])) as import("@/lib/profitability-predictor").ProfitabilityPrediction

    console.log(`✅ [PROCESS] predictProfitability() returned successfully!`)
    console.log(`📝 [PROCESS] Prediction result summary:`, {
      hasWebsiteAnalysis: !!prediction.websiteAnalysis,
      hasROI: !!prediction.roiPrediction,
      keywordCount: prediction.recommendedKeywords?.length || 0,
      websiteDomain: prediction.websiteAnalysis?.domain,
      roiPercentage: prediction.roiPrediction?.roiPercentage,
      estimatedClicks: prediction.roiPrediction?.estimatedClicks,
    })
    console.log(`✅ [PROCESS] Analysis ${analysisId} completed successfully`)
    console.log(`${"=".repeat(80)}\n`)
  } catch (error) {
    console.error(`❌ [PROCESS] Analysis ${analysisId} failed:`, error)
    console.error(`❌ [PROCESS] Error type:`, error?.constructor?.name)
    console.error(`❌ Full error details:`, {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "No message",
      stack:
        error instanceof Error
          ? error.stack?.split("\n").slice(0, 5)
          : "No stack",
    })

    // Update status to failed with error details
    await supabase
      .from("profitability_analyses")
      .update({
        status: "failed",
        progress: 0,
        completed_at: new Date().toISOString(),
        result_data: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })
      .eq("id", analysisId)
  }
}
