import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

// Helper function to check if user is admin or super_admin
async function checkAdminAccess() {
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (
    profileError ||
    !profile ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    return { error: "Admin access required", status: 403 }
  }

  return { user, profile, supabase }
}

// Validation schema for admin website updates
const adminWebsiteUpdateSchema = z.object({
  url: z.string().url("Invalid URL format").optional(),
  name: z.string().optional(),
  business_type: z.enum(["ecommerce", "service", "vitrine"]).optional(),
  target_countries: z
    .array(z.string())
    .min(1, "At least one country must be selected")
    .optional(),
  site_languages: z
    .array(z.string())
    .min(1, "At least one language must be selected")
    .optional(),
  industry: z.string().optional(),
  monthly_ads_budget: z.number().min(0, "Budget must be positive").optional(),
  is_primary: z.boolean().optional(),
  is_verified: z.boolean().optional(),
})

// GET - Retrieve specific website for admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkAdminAccess()
    if ("error" in accessCheck) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { supabase } = accessCheck
    const { id } = await params

    // Get website with user information
    const { data: website, error } = await supabase
      .from("user_websites")
      .select(
        `
        *,
        profiles!inner(email, full_name)
      `
      )
      .eq("id", id)
      .single()

    if (error || !website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 })
    }

    return NextResponse.json(website)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Update website (admin can modify any website)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkAdminAccess()
    if ("error" in accessCheck) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { supabase } = accessCheck
    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    const validationResult = adminWebsiteUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Admin can update any website, bypassing user ownership check
    const { data: updatedWebsite, error } = await supabase
      .from("user_websites")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        profiles!inner(email, full_name)
      `
      )
      .single()

    if (error || !updatedWebsite) {
      return NextResponse.json(
        { error: "Failed to update website or website not found" },
        { status: error?.code === "PGRST116" ? 404 : 500 }
      )
    }

    return NextResponse.json(updatedWebsite)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete website (admin can delete any website)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkAdminAccess()
    if ("error" in accessCheck) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { supabase } = accessCheck
    const { id } = await params

    // Admin can delete any website
    const { data: deletedWebsite, error } = await supabase
      .from("user_websites")
      .delete()
      .eq("id", id)
      .select()
      .single()

    if (error || !deletedWebsite) {
      return NextResponse.json(
        { error: "Failed to delete website or website not found" },
        { status: error?.code === "PGRST116" ? 404 : 500 }
      )
    }

    return NextResponse.json({ message: "Website deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
