import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { SubscriptionPack, HARDCODED_PACKS } from "@/lib/subscription-utils"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    // Check if user is super admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || profile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Access denied. Super admin role required." },
        { status: 403 }
      )
    }

    // Fetch all packs from database
    const { data: packs, error: packsError } = await supabase
      .from("subscription_packs")
      .select("*")
      .order("sort_order", { ascending: true })

    if (packsError) {
      console.error("Error fetching packs:", packsError)
      return NextResponse.json(
        { error: "Failed to fetch packs", data: HARDCODED_PACKS },
        { status: 200 }
      )
    }

    return NextResponse.json({
      data: packs || HARDCODED_PACKS,
      message: "Packs fetched successfully",
    })
  } catch (error) {
    console.error("Error in GET /api/admin/packs:", error)
    return NextResponse.json(
      { error: "Internal server error", data: HARDCODED_PACKS },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Check if user is super admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || profile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Access denied. Super admin role required." },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const {
      name,
      display_name_en,
      display_name_fr,
      description_en,
      description_fr,
      price_monthly,
      price_yearly,
      features,
      quotas,
      is_enabled = true,
      is_popular = false,
      sort_order = 0,
    } = body

    if (!name || !display_name_en || !display_name_fr || !quotas) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate pack name
    const validPackNames = ["free", "starter", "pro", "advanced"]
    if (!validPackNames.includes(name)) {
      return NextResponse.json(
        {
          error: `Invalid pack name. Must be one of: ${validPackNames.join(", ")}`,
        },
        { status: 400 }
      )
    }

    // Insert or update pack
    const packData = {
      name,
      display_name_en,
      display_name_fr,
      description_en: description_en || "",
      description_fr: description_fr || "",
      price_monthly: Number(price_monthly) || 0,
      price_yearly: Number(price_yearly) || 0,
      features: Array.isArray(features) ? features : [],
      quotas: typeof quotas === "object" ? quotas : {},
      is_enabled: Boolean(is_enabled),
      is_popular: Boolean(is_popular),
      sort_order: Number(sort_order) || 0,
    }

    const { data, error } = await supabase
      .from("subscription_packs")
      .upsert(packData)
      .select()
      .single()

    if (error) {
      console.error("Error creating/updating pack:", error)
      return NextResponse.json(
        { error: "Failed to create/update pack" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      message: "Pack created/updated successfully",
    })
  } catch (error) {
    console.error("Error in POST /api/admin/packs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
