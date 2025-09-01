import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

// Validation schema for website data
const websiteSchema = z.object({
  url: z.string().url("Invalid URL format"),
  name: z.string().optional(),
  business_type: z.enum(["ecommerce", "service", "vitrine"]),
  target_countries: z
    .array(z.string())
    .min(1, "At least one country must be selected"),
  site_languages: z
    .array(z.string())
    .min(1, "At least one language must be selected"),
  industry: z.string().optional(),
  monthly_ads_budget: z.number().min(0, "Budget must be positive").optional(),
  is_primary: z.boolean().optional().default(false),
})

// GET - Retrieve user's websites
export async function GET() {
  try {
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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get user's websites with quota information
    const { data: websites, error: websitesError } = await supabase
      .from("user_websites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (websitesError) {
      console.error("Error fetching websites:", websitesError)
      return NextResponse.json(
        { error: "Failed to fetch websites" },
        { status: 500 }
      )
    }

    // Get quota information
    const { data: quotaInfo, error: quotaError } = await supabase
      .from("user_website_quotas")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (quotaError) {
      console.error("Error fetching quota:", quotaError)
      return NextResponse.json(
        { error: "Failed to fetch quota information" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      websites,
      quota: quotaInfo,
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/profile/websites:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new website
export async function POST(request: NextRequest) {
  try {
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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = websiteSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const websiteData = validationResult.data

    // Check quota before insertion (will be enforced by trigger but good UX to check first)
    const { data: quotaInfo } = await supabase
      .from("user_website_quotas")
      .select("websites_used, websites_limit, quota_reached")
      .eq("user_id", user.id)
      .single()

    if (quotaInfo?.quota_reached) {
      return NextResponse.json(
        {
          error: "Website quota exceeded",
          quota: quotaInfo,
        },
        { status: 403 }
      )
    }

    // Insert new website
    const { data: newWebsite, error: insertError } = await supabase
      .from("user_websites")
      .insert({
        ...websiteData,
        user_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating website:", insertError)

      // Handle quota exceeded error from trigger
      if (insertError.message?.includes("quota exceeded")) {
        return NextResponse.json(
          { error: "Website quota exceeded for your current plan" },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: "Failed to create website" },
        { status: 500 }
      )
    }

    return NextResponse.json(newWebsite, { status: 201 })
  } catch (error) {
    console.error("Unexpected error in POST /api/profile/websites:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
