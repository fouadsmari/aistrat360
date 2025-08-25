const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase avec la clé service_role
const supabaseUrl = 'https://ypygrfrwpddqjbahgayc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweWdyZnJ3cGRkcWpiYWhnYXljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA3NzQ5OSwiZXhwIjoyMDcxNjUzNDk5fQ.KpnuJnxvULiNC0sxrQwF7j4yxM-P6eFjO70tP6MGq5E'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAdmin() {
  try {
    const adminId = '1c4e72dc-c0c7-46b6-9ccb-52e442928571'
    
    console.log('🔧 Configuration finale de l\'admin...')

    // 1. Mettre à jour le profil avec nom complet
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        full_name: 'System Administrator',
        role: 'admin'
      })
      .eq('id', adminId)

    if (updateError) {
      console.error('❌ Erreur mise à jour profil:', updateError)
      return
    }

    console.log('✅ Profil mis à jour!')

    // 2. Vérifier les permissions existantes
    const { data: existingPermissions, error: permError } = await supabase
      .from('admin_permissions')
      .select('permission_type, resource')
      .eq('user_id', adminId)

    if (permError) {
      console.error('❌ Erreur lecture permissions:', permError)
      return
    }

    console.log('🛠️  Permissions existantes:', existingPermissions)

    // 3. Ajouter les permissions admin nécessaires
    const requiredPermissions = [
      { permission_type: 'manage_users', resource: null },
      { permission_type: 'manage_subscriptions', resource: null },
      { permission_type: 'view_analytics', resource: null },
      { permission_type: 'system_settings', resource: null }
    ]

    // Filtrer les permissions manquantes
    const existingTypes = existingPermissions.map(p => p.permission_type)
    const missingPermissions = requiredPermissions.filter(p => 
      !existingTypes.includes(p.permission_type)
    )

    if (missingPermissions.length > 0) {
      console.log('➕ Ajout des permissions:', missingPermissions.map(p => p.permission_type))
      
      const { error: addPermError } = await supabase
        .from('admin_permissions')
        .insert(
          missingPermissions.map(perm => ({
            user_id: adminId,
            permission_type: perm.permission_type,
            resource: perm.resource,
            granted_by: adminId // Auto-accordé
          }))
        )

      if (addPermError) {
        console.error('❌ Erreur ajout permissions:', addPermError)
      } else {
        console.log('✅ Permissions ajoutées!')
      }
    } else {
      console.log('✅ Toutes les permissions sont déjà présentes')
    }

    // 4. Vérification finale
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminId)
      .single()

    const { data: finalPermissions } = await supabase
      .from('admin_permissions')
      .select('permission_type, resource')
      .eq('user_id', adminId)

    console.log('\n🎉 Configuration admin complète:')
    console.log('🆔 ID:', finalProfile.id)
    console.log('👤 Nom:', finalProfile.full_name)
    console.log('📧 Email:', finalProfile.email)
    console.log('👨‍💼 Rôle:', finalProfile.role)
    console.log('🌐 Langue:', finalProfile.preferred_language)
    console.log('🛠️  Permissions:', finalPermissions.map(p => p.permission_type))
    
    console.log('\n🚀 Identifiants de connexion:')
    console.log('📧 Email: admin@example.com')
    console.log('🔐 Mot de passe: Admin123!@#')
    console.log('🌐 URL de test: https://aistrat360.vercel.app/fr/login')
    
    console.log('\n⚠️  Important: Configurez les variables d\'environnement sur Vercel!')

  } catch (error) {
    console.error('💥 Erreur:', error)
  }
}

setupAdmin()