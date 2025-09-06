import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const websiteId = searchParams.get("website_id")
    const pageUrl = searchParams.get("page_url")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build query
    let query = supabase
      .from("google_ads_campaigns")
      .select(
        `
        *,
        user_websites (
          name,
          url,
          business_type
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (websiteId) {
      query = query.eq("website_id", websiteId)
    }
    if (pageUrl) {
      query = query.eq("page_url", pageUrl)
    }

    const { data: campaigns, error: campaignsError } = await query

    if (campaignsError) {
      console.error("Campaigns fetch error:", campaignsError)
      return NextResponse.json(
        { error: "Failed to fetch campaigns" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaigns: campaigns || [],
    })
  } catch (error) {
    console.error("Campaigns retrieval error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve campaigns" },
      { status: 500 }
    )
  }
}
