import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
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

    // Check user quota
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        `
        subscription_pack_id,
        subscription_packs (
          analyses_per_month
        )
      `
      )
      .eq("id", user.id)
      .single()

    // Get current month usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: usedAnalyses } = await supabase
      .from("profitability_analyses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString())

    const monthlyLimit =
      (profile?.subscription_packs as any)?.analyses_per_month || 3
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

    // TODO: Start background processing (queue job)
    // For now, we'll just return the analysis ID
    // Later this will trigger DataForSEO API calls and AI processing

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
