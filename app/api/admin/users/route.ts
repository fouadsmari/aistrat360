import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Service role client pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// GET - Récupère tous les utilisateurs (service role bypass RLS)
export async function GET() {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: profiles })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Crée un nouvel utilisateur
export async function POST(request: Request) {
  try {
    const userData = await request.json()

    // Crée l'utilisateur avec auth.admin
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password || "TempPass123!", // Mot de passe temporaire
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          full_name: `${userData.first_name} ${userData.last_name}`,
          role: userData.role,
        },
        app_metadata: {
          role: userData.role,
        },
      })

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Le trigger handle_new_user devrait créer le profil automatiquement
    return NextResponse.json({
      message: "User created successfully",
      user: authUser.user,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Met à jour un utilisateur
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")
    const userData = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Met à jour le profil
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.first_name} ${userData.last_name}`,
        role: userData.role,
        is_active: userData.is_active,
        address: userData.address,
        city: userData.city,
        postal_code: userData.postal_code,
        country: userData.country,
      })
      .eq("id", userId)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Met à jour les métadonnées auth si besoin
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          full_name: `${userData.first_name} ${userData.last_name}`,
          role: userData.role,
        },
        app_metadata: {
          role: userData.role,
        },
      }
    )

    if (authError) {
      console.error("Auth metadata update error:", authError)
      // Continue quand même car le profil est mis à jour
    }

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Supprime un utilisateur
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Supprime l'utilisateur auth (cascade supprime profile et subscriptions)
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
