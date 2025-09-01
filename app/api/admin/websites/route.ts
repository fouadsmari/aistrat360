import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

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

// GET - Retrieve all websites for admin management
export async function GET(request: NextRequest) {
  try {
    const accessCheck = await checkAdminAccess()
    if ("error" in accessCheck) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { supabase } = accessCheck
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    let query = supabase
      .from("user_websites")
      .select(
        `
        *,
        profiles!inner(email, full_name)
      `
      )
      .order("created_at", { ascending: false })

    // Filter by user if specified
    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: websites, error } = await query

    if (error) {
      console.error("Error fetching websites for admin:", error)
      return NextResponse.json(
        { error: "Failed to fetch websites" },
        { status: 500 }
      )
    }

    return NextResponse.json({ websites })
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/websites:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
