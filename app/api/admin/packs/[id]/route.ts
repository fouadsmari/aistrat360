import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (
      profileError ||
      (profile?.role !== "super_admin" && profile?.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Access denied. Admin role required." },
        { status: 403 }
      )
    }

    // Fetch pack by ID
    const { id } = await params
    const { data: pack, error: packError } = await supabase
      .from("subscription_packs")
      .select("*")
      .eq("id", id)
      .single()

    if (packError || !pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 })
    }

    return NextResponse.json({
      data: pack,
      message: "Pack fetched successfully",
    })
  } catch (error) {
    console.error("Error in GET /api/admin/packs/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (
      profileError ||
      (profile?.role !== "super_admin" && profile?.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Access denied. Admin role required." },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate pack exists
    const { id } = await params
    const { data: existingPack, error: existError } = await supabase
      .from("subscription_packs")
      .select("id, name")
      .eq("id", id)
      .single()

    if (existError || !existingPack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 })
    }

    // Validate pack name if provided
    if (body.name && body.name !== existingPack.name) {
      const validPackNames = ["free", "starter", "pro", "advanced"]
      if (!validPackNames.includes(body.name)) {
        return NextResponse.json(
          {
            error: `Invalid pack name. Must be one of: ${validPackNames.join(", ")}`,
          },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}

    if (body.display_name_en !== undefined)
      updateData.display_name_en = body.display_name_en
    if (body.display_name_fr !== undefined)
      updateData.display_name_fr = body.display_name_fr
    if (body.description_en !== undefined)
      updateData.description_en = body.description_en
    if (body.description_fr !== undefined)
      updateData.description_fr = body.description_fr
    if (body.price_monthly !== undefined)
      updateData.price_monthly = Number(body.price_monthly)
    if (body.price_yearly !== undefined)
      updateData.price_yearly = Number(body.price_yearly)
    if (body.features !== undefined)
      updateData.features = Array.isArray(body.features) ? body.features : []
    if (body.quotas !== undefined)
      updateData.quotas = typeof body.quotas === "object" ? body.quotas : {}
    if (body.is_enabled !== undefined)
      updateData.is_enabled = Boolean(body.is_enabled)
    if (body.is_popular !== undefined)
      updateData.is_popular = Boolean(body.is_popular)
    if (body.sort_order !== undefined)
      updateData.sort_order = Number(body.sort_order)

    // Update pack
    const { data, error } = await supabase
      .from("subscription_packs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating pack:", error)
      return NextResponse.json(
        { error: "Failed to update pack" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      message: "Pack updated successfully",
    })
  } catch (error) {
    console.error("Error in PUT /api/admin/packs/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (
      profileError ||
      (profile?.role !== "super_admin" && profile?.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Access denied. Admin role required." },
        { status: 403 }
      )
    }

    // Check if pack is being used by any subscriptions
    const { id } = await params
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("plan", id)
      .limit(1)

    if (subError) {
      console.error("Error checking pack usage:", subError)
      return NextResponse.json(
        { error: "Failed to check pack usage" },
        { status: 500 }
      )
    }

    if (subscriptions && subscriptions.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete pack that is currently in use by subscribers" },
        { status: 400 }
      )
    }

    // Delete pack
    const { error } = await supabase
      .from("subscription_packs")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting pack:", error)
      return NextResponse.json(
        { error: "Failed to delete pack" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Pack deleted successfully",
    })
  } catch (error) {
    console.error("Error in DELETE /api/admin/packs/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
