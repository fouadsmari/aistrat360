const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase avec la clé service_role
const supabaseUrl = 'https://ypygrfrwpddqjbahgayc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweWdyZnJ3cGRkcWpiYWhnYXljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA3NzQ5OSwiZXhwIjoyMDcxNjUzNDk5fQ.KpnuJnxvULiNC0sxrQwF7j4yxM-P6eFjO70tP6MGq5E'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAdmin() {
  try {
    console.log('🔍 Vérification de l\'utilisateur admin...')

    // 1. Vérifier l'utilisateur dans Auth
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError)
      return
    }

    const adminUser = users.users.find(u => u.email === 'admin@example.com')
    console.log('👤 Utilisateur auth trouvé:', adminUser ? 'OUI' : 'NON')
    
    if (adminUser) {
      console.log('🆔 ID:', adminUser.id)
      console.log('📧 Email:', adminUser.email)
      console.log('✅ Confirmé:', adminUser.email_confirmed_at ? 'OUI' : 'NON')
    }

    // 2. Vérifier le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        admin_permissions(permission)
      `)
      .eq('email', 'admin@example.com')
      .single()

    if (profileError) {
      console.error('❌ Erreur profil:', profileError)
      
      if (adminUser) {
        console.log('🔧 Création du profil manquant...')
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: adminUser.id,
            email: 'admin@example.com',
            full_name: 'System Administrator', 
            role: 'admin',
            preferred_language: 'fr'
          })
          .select()

        if (createError) {
          console.error('❌ Erreur création profil:', createError)
        } else {
          console.log('✅ Profil créé:', newProfile)
        }
      }
      return
    }

    console.log('✅ Profil trouvé:')
    console.log('📛 Nom:', profile.full_name)
    console.log('👨‍💼 Rôle:', profile.role)
    console.log('🌐 Langue:', profile.preferred_language)
    console.log('🛠️  Permissions:', profile.admin_permissions.map(p => p.permission))

    // 3. Ajouter permissions manquantes si nécessaire
    const requiredPermissions = ['manage_users', 'manage_subscriptions', 'view_analytics', 'system_settings']
    const existingPermissions = profile.admin_permissions.map(p => p.permission)
    const missingPermissions = requiredPermissions.filter(p => !existingPermissions.includes(p))

    if (missingPermissions.length > 0) {
      console.log('➕ Ajout des permissions manquantes:', missingPermissions)
      
      const { error: permError } = await supabase
        .from('admin_permissions')
        .insert(
          missingPermissions.map(permission => ({
            user_id: profile.id,
            permission
          }))
        )

      if (permError) {
        console.error('❌ Erreur permissions:', permError)
      } else {
        console.log('✅ Permissions ajoutées!')
      }
    }

    console.log('\n🎉 Configuration admin complète!')
    console.log('🌐 URL de test: https://aistrat360.vercel.app/fr/login')
    console.log('📧 Email: admin@example.com')
    console.log('🔑 Mot de passe: Admin123!@#')

  } catch (error) {
    console.error('💥 Erreur:', error)
  }
}

checkAdmin()