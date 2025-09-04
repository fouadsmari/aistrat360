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

// GET - Retrieve websites with pagination for admin management
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20"))
    )
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""

    const offset = (page - 1) * limit

    let query = supabase.from("user_websites").select(
      `
        *,
        profiles!inner(email, full_name)
      `,
      { count: "exact" }
    )

    // Apply filters
    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,url.ilike.%${search}%,domain.ilike.%${search}%`
      )
    }

    if (status && ["active", "inactive", "suspended"].includes(status)) {
      query = query.eq("status", status)
    }

    // Apply pagination and ordering
    const {
      data: websites,
      error,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch websites" },
        { status: 500 }
      )
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      websites: websites || [],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        search,
        status,
        user_id: userId,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
