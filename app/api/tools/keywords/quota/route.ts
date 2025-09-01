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

    // Get user subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single()

    let monthlyLimit = 3 // Default for free plan
    let planName = "free"

    if (subscription) {
      planName = subscription.plan
      // Get the subscription plan details based on plan name
      const { data: plan, error: planError } = await supabase
        .from("subscription_plans")
        .select("analyses_per_month")
        .eq("name", subscription.plan)
        .single()

      monthlyLimit = plan?.analyses_per_month || 3
    }

    // Get current month usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: usedAnalyses, error: countError } = await supabase
      .from("dataforseo_analyses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString())

    if (countError) {
      return NextResponse.json(
        { error: "Failed to check quota" },
        { status: 500 }
      )
    }

    const isUnlimited = monthlyLimit === -1
    const remaining = isUnlimited
      ? 999
      : Math.max(0, monthlyLimit - (usedAnalyses || 0))

    return NextResponse.json({
      quota: {
        used: usedAnalyses || 0,
        limit: monthlyLimit,
        remaining,
        isUnlimited,
        planName,
        resetDate: new Date(
          startOfMonth.getFullYear(),
          startOfMonth.getMonth() + 1,
          1
        ).toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
