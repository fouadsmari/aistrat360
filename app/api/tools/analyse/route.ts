import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ProfitabilityPredictor } from "@/lib/profitability-predictor"
import { z } from "zod"

const analyseRequestSchema = z.object({
  websiteUrl: z.string().url(),
  budget: z.number().min(100).max(100000),
  objective: z.enum(["leads", "sales", "traffic", "awareness"]),
  keywords: z.string().optional(),
})

export async function POST(request: NextRequest) {
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

    // Validate request body
    const body = await request.json()
    const validatedData = analyseRequestSchema.parse(body)

    // Check user quota - Fixed to use subscriptions table correctly
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single()

    let monthlyLimit = 3 // Default for free plan

    if (subscription) {
      // Get the subscription pack details based on plan name
      const { data: pack } = await supabase
        .from("subscription_packs")
        .select("analyses_per_month")
        .eq("name", subscription.plan)
        .single()

      monthlyLimit = pack?.analyses_per_month || 3
      console.log(
        `User ${user.email} has plan: ${subscription.plan}, limit: ${monthlyLimit}`
      )
    }

    // Get current month usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: usedAnalyses } = await supabase
      .from("profitability_analyses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString())
    const isUnlimited = monthlyLimit === -1
    const remaining = isUnlimited
      ? 999
      : Math.max(0, monthlyLimit - (usedAnalyses || 0))

    if (!isUnlimited && remaining <= 0) {
      return NextResponse.json(
        { error: "Quota exceeded. Please upgrade your plan." },
        { status: 403 }
      )
    }

    // Create profitability analysis record
    const { data: analysis, error: insertError } = await supabase
      .from("profitability_analyses")
      .insert({
        user_id: user.id,
        analysis_type: "profitability_prediction",
        input_data: {
          websiteUrl: validatedData.websiteUrl,
          budget: validatedData.budget,
          objective: validatedData.objective,
          keywords: validatedData.keywords || "",
        },
        status: "pending",
        progress: 0,
        credits_used: 2,
      })
      .select()
      .single()

    if (insertError || !analysis) {
      console.error("Failed to create analysis:", insertError)
      return NextResponse.json(
        { error: "Failed to create analysis" },
        { status: 500 }
      )
    }

    // Start background processing
    // In production, you'd use a queue system like BullMQ or similar
    // For now, we'll process directly but return immediately
    processAnalysis(analysis.id, validatedData).catch(console.error)

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      message: "Analysis started successfully",
    })
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
  const supabase = await createSupabaseServerClient()
  const predictor = new ProfitabilityPredictor()

  try {
    console.log(`🚀 Starting analysis ${analysisId} for ${input.websiteUrl}`)

    // Update progress callback
    const updateProgress = async (progress: number, status: string) => {
      console.log(`📊 Analysis ${analysisId}: ${progress}% - ${status}`)
      await supabase
        .from("profitability_analyses")
        .update({
          progress,
          status: progress === 100 ? "completed" : "processing",
        })
        .eq("id", analysisId)
    }

    // Start processing
    await updateProgress(5, "Initialisation de l'analyse...")

    // Run prediction with timeout
    const prediction = await Promise.race([
      predictor.predictProfitability(
        {
          websiteUrl: input.websiteUrl,
          budget: input.budget,
          objective: input.objective,
          keywords: input.keywords,
        },
        analysisId,
        updateProgress
      ),
      // 5 minute timeout
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Analysis timeout after 5 minutes")),
          5 * 60 * 1000
        )
      ),
    ])

    console.log(`✅ Analysis ${analysisId} completed successfully`)
  } catch (error) {
    console.error(`❌ Analysis ${analysisId} failed:`, error)

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
