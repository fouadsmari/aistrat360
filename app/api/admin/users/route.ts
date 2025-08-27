import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

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
    return { authorized: false, error: "Unauthorized" }
  }

  // Use admin client to bypass RLS for profile check
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (
    !profile ||
    (profile.role !== "admin" && profile.role !== "super_admin")
  ) {
    return { authorized: false, error: "Forbidden - Admin access required" }
  }

  return { authorized: true, userId: user.id, role: profile.role }
}

// GET - Récupère tous les utilisateurs avec leurs abonnements (service role bypass RLS)
export async function GET() {
  try {
    // Check admin access
    const { authorized, error: authError } = await checkAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: 403 })
    }

    // Récupère les profils avec les abonnements joints
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select(
        `
        *,
        subscriptions (
          plan,
          status,
          current_period_start,
          current_period_end,
          trial_start,
          trial_end
        )
      `
      )
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transforme les données pour inclure le plan directement dans l'objet utilisateur
    const usersWithSubscriptions = profiles.map((profile) => ({
      ...profile,
      subscription_plan: profile.subscriptions?.[0]?.plan || "free",
      subscription_status: profile.subscriptions?.[0]?.status || "active",
      subscription_details: profile.subscriptions?.[0] || null,
    }))

    return NextResponse.json({ users: usersWithSubscriptions })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Gère création ET mise à jour d'utilisateurs (Vercel compatible)
export async function POST(request: Request) {
  try {
    // Check admin access
    const { authorized, error: accessError } = await checkAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: accessError }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")
    const userData = await request.json()

    // Si userId fourni, c'est une mise à jour, sinon c'est une création
    if (userId) {
      return await updateUser(userId, userData)
    } else {
      return await createUser(userData)
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Fonction pour créer un utilisateur
async function createUser(userData: any) {
  try {
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
      return NextResponse.json(
        { error: authError?.message || authError },
        { status: 400 }
      )
    }

    // Le trigger handle_new_user devrait créer le profil automatiquement
    return NextResponse.json({
      message: "User created successfully",
      user: authUser.user,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Fonction pour mettre à jour un utilisateur
async function updateUser(userId: string, userData: any) {
  console.log("🔥🔥🔥 === DÉBUT API updateUser ===")
  console.log("🆔 User ID reçu:", userId)
  console.log(
    "📊 Données utilisateur reçues:",
    JSON.stringify(userData, null, 2)
  )
  console.log("🎯 Plan d'abonnement dans userData:", {
    plan: userData.subscription_plan,
    type: typeof userData.subscription_plan,
    valeur_brute: JSON.stringify(userData.subscription_plan),
  })

  try {
    if (!userId) {
      console.error("❌ User ID manquant!")
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    console.log("📝 Mise à jour du profil utilisateur...")
    // Met à jour le profil
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.first_name} ${userData.last_name}`,
        role: userData.role,
        is_active: userData.is_active,
        phone: userData.phone,
        company: userData.company,
        address: userData.address,
        city: userData.city,
        postal_code: userData.postal_code,
        country: userData.country,
      })
      .eq("id", userId)

    if (profileError) {
      console.error("❌ Erreur mise à jour profil:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    console.log("✅ Profil utilisateur mis à jour avec succès")

    // Prepare auth update data
    const authUpdateData: any = {
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

    // Add email and password if provided
    if (userData.email) {
      authUpdateData.email = userData.email
    }
    if (userData.password && userData.password.trim() !== "") {
      authUpdateData.password = userData.password
    }

    // Met à jour les métadonnées auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      authUpdateData
    )

    if (authError) {
      return NextResponse.json(
        { error: authError?.message || authError },
        { status: 500 }
      )
    }

    // Met à jour l'abonnement si un plan est fourni
    console.log("🎯 Vérification du plan d'abonnement...")
    console.log("🎯 Plan fourni:", userData.subscription_plan)
    console.log("🎯 Plans valides:", ["free", "starter", "pro", "advanced"])

    if (userData.subscription_plan) {
      console.log("🎯 Plan détecté, vérification de la validité...")
      const isValidPlan = ["free", "starter", "pro", "advanced"].includes(
        userData.subscription_plan
      )
      console.log("🎯 Plan valide?", isValidPlan)

      if (isValidPlan) {
        console.log("✅ Plan valide détecté:", userData.subscription_plan)
        try {
          // Vérifie d'abord si un abonnement existe déjà
          console.log(
            "🔍 Recherche d'un abonnement existant pour user:",
            userId
          )
          const { data: existingSubscription, error: selectError } =
            await supabaseAdmin
              .from("subscriptions")
              .select("*")
              .eq("user_id", userId)
              .single()

          console.log("📋 Abonnement existant trouvé:", existingSubscription)
          console.log("📋 Erreur de recherche:", selectError)

          if (selectError && selectError.code !== "PGRST116") {
            console.error("❌ Erreur lors de la recherche:", selectError)
            throw selectError
          }

          const now = new Date()
          const subscriptionData = {
            user_id: userId,
            plan: userData.subscription_plan,
            status: userData.subscription_status || "active",
            current_period_start: now.toISOString(),
            current_period_end: null,
            trial_start: null,
            trial_end: null,
            cancel_at_period_end: false,
          }

          console.log(
            "💾 Données d'abonnement à sauvegarder:",
            subscriptionData
          )

          if (existingSubscription) {
            console.log("🔄 Mise à jour de l'abonnement existant...")
            const { error: subscriptionError } = await supabaseAdmin
              .from("subscriptions")
              .update(subscriptionData)
              .eq("user_id", userId)

            if (subscriptionError) {
              console.error(
                "❌ Erreur mise à jour abonnement:",
                subscriptionError
              )
              throw subscriptionError
            }
            console.log("✅ Abonnement mis à jour avec succès")
          } else {
            console.log("➕ Création d'un nouvel abonnement...")
            const { error: subscriptionError } = await supabaseAdmin
              .from("subscriptions")
              .insert(subscriptionData)

            if (subscriptionError) {
              console.error("❌ Erreur création abonnement:", subscriptionError)
              throw subscriptionError
            }
            console.log("✅ Nouvel abonnement créé avec succès")
          }
        } catch (subscriptionError) {
          console.error(
            "💥 ERREUR CRITIQUE lors de la gestion de l'abonnement:",
            subscriptionError
          )
          return NextResponse.json(
            {
              error: `Failed to update subscription: ${subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError)}`,
            },
            { status: 500 }
          )
        }
      } else {
        console.warn("⚠️ Plan fourni invalide:", {
          plan: userData.subscription_plan,
          type: typeof userData.subscription_plan,
          plansValides: ["free", "starter", "pro", "advanced"],
        })
      }
    } else {
      console.log("ℹ️ Aucun plan d'abonnement fourni dans les données")
    }

    console.log("🎉🎉🎉 === FIN API updateUser (SUCCÈS) ===")
    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("💥💥💥 === ERREUR CRITIQUE API updateUser ===", error)
    console.error("💥 Type erreur:", typeof error)
    console.error(
      "💥 Message erreur:",
      error instanceof Error ? error.message : String(error)
    )
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Supprime un utilisateur
export async function DELETE(request: Request) {
  try {
    // Check admin access
    const { authorized, error: accessError } = await checkAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: accessError }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Supprime l'utilisateur auth (cascade supprime profile et subscriptions)
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      return NextResponse.json(
        { error: authError?.message || authError },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
