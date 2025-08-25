const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase avec la clé service_role pour les opérations d'admin
const supabaseUrl = 'https://ypygrfrwpddqjbahgayc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweWdyZnJ3cGRkcWpiYWhnYXljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA3NzQ5OSwiZXhwIjoyMDcxNjUzNDk5fQ.KpnuJnxvULiNC0sxrQwF7j4yxM-P6eFjO70tP6MGq5E'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    console.log('🔧 Création de l\'utilisateur admin...')
    
    // 1. Créer l'utilisateur dans Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'Admin123!@#',
      email_confirm: true
    })

    if (authError) {
      console.error('❌ Erreur lors de la création de l\'utilisateur auth:', authError)
      return
    }

    console.log('✅ Utilisateur auth créé:', authUser.user.id)

    // 2. Créer le profil dans la table profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: 'admin@example.com',
        full_name: 'System Administrator',
        role: 'admin',
        preferred_language: 'fr'
      })
      .select()

    if (profileError) {
      console.error('❌ Erreur lors de la création du profil:', profileError)
      return
    }

    console.log('✅ Profil admin créé:', profile)

    // 3. Ajouter les permissions admin
    const permissions = [
      'manage_users',
      'manage_subscriptions', 
      'view_analytics',
      'system_settings'
    ]

    const { data: adminPermissions, error: permissionsError } = await supabase
      .from('admin_permissions')
      .insert(
        permissions.map(permission => ({
          user_id: authUser.user.id,
          permission
        }))
      )
      .select()

    if (permissionsError) {
      console.error('❌ Erreur lors de l\'ajout des permissions:', permissionsError)
      return
    }

    console.log('✅ Permissions admin ajoutées:', adminPermissions)

    // 4. Vérifier la création
    const { data: verification, error: verificationError } = await supabase
      .from('profiles')
      .select(`
        *,
        admin_permissions(permission)
      `)
      .eq('id', authUser.user.id)
      .single()

    if (verificationError) {
      console.error('❌ Erreur lors de la vérification:', verificationError)
      return
    }

    console.log('🎉 Admin créé avec succès!')
    console.log('📧 Email:', verification.email)
    console.log('🔑 Mot de passe: Admin123!@#')
    console.log('👤 Rôle:', verification.role)
    console.log('🛠️  Permissions:', verification.admin_permissions.map(p => p.permission))
    console.log('\n🌐 Testez la connexion sur: https://aistrat360.vercel.app/fr/login')

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  }
}

createAdminUser()