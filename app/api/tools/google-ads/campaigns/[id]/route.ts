import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id } = await params

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
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
      .eq("id", id)
      .single()

    if (campaignError) {
      console.error("Campaign fetch error:", campaignError)
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error) {
    console.error("Campaign retrieval error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve campaign" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id } = await params

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await req.json()

    // Update campaign
    const { data: campaign, error: updateError } = await supabase
      .from("google_ads_campaigns")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id) // Ensure user owns the campaign
      .select()
      .single()

    if (updateError) {
      console.error("Campaign update error:", updateError)
      return NextResponse.json(
        { error: "Failed to update campaign" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error) {
    console.error("Campaign update error:", error)
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id } = await params

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete campaign
    const { error: deleteError } = await supabase
      .from("google_ads_campaigns")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id) // Ensure user owns the campaign

    if (deleteError) {
      console.error("Campaign delete error:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete campaign" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Campaign deleted successfully",
    })
  } catch (error) {
    console.error("Campaign deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    )
  }
}
