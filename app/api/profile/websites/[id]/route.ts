import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

// Validation schema for website updates
const websiteUpdateSchema = z.object({
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
})

// GET - Retrieve specific website
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Get specific website
    const { data: website, error: websiteError } = await supabase
      .from("user_websites")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (websiteError || !website) {
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

// POST - Update website (using POST instead of PUT per Vercel requirements)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    const validationResult = websiteUpdateSchema.safeParse(body)

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

    // Update website
    const { data: updatedWebsite, error: updateError } = await supabase
      .from("user_websites")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError || !updatedWebsite) {
      return NextResponse.json(
        { error: "Failed to update website or website not found" },
        { status: updateError?.code === "PGRST116" ? 404 : 500 }
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

// DELETE - Delete website
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Delete website
    const { data: deletedWebsite, error: deleteError } = await supabase
      .from("user_websites")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (deleteError || !deletedWebsite) {
      return NextResponse.json(
        { error: "Failed to delete website or website not found" },
        { status: deleteError?.code === "PGRST116" ? 404 : 500 }
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
