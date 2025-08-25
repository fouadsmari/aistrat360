const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase avec la clé service_role
const supabaseUrl = 'https://ypygrfrwpddqjbahgayc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweWdyZnJ3cGRkcWpiYWhnYXljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA3NzQ5OSwiZXhwIjoyMDcxNjUzNDk5fQ.KpnuJnxvULiNC0sxrQwF7j4yxM-P6eFjO70tP6MGq5E'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAdmin() {
  try {
    const adminId = '1c4e72dc-c0c7-46b6-9ccb-52e442928571'
    
    console.log('🔧 Mise à jour de l\'admin existant...')

    // 1. Vérifier le profil existant
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminId)
      .single()

    if (checkError) {
      console.log('❌ Profil n\'existe pas, création...')
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: adminId,
          email: 'admin@example.com',
          full_name: 'System Administrator',
          role: 'admin',
          preferred_language: 'fr'
        })
        .select()

      if (createError) {
        console.error('❌ Erreur création:', createError)
        return
      }
      
      console.log('✅ Profil créé:', newProfile)
    } else {
      console.log('✅ Profil existant trouvé:', existingProfile)
      
      // Mettre à jour le rôle si nécessaire
      if (existingProfile.role !== 'admin') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', adminId)

        if (updateError) {
          console.error('❌ Erreur mise à jour rôle:', updateError)
        } else {
          console.log('✅ Rôle mis à jour vers admin')
        }
      }
    }

    // 2. Vérifier et ajouter les permissions
    const { data: permissions, error: permError } = await supabase
      .from('admin_permissions')
      .select('permission')
      .eq('user_id', adminId)

    if (permError) {
      console.error('❌ Erreur permissions:', permError)
    } else {
      console.log('🛠️  Permissions existantes:', permissions.map(p => p.permission))
    }

    const requiredPermissions = ['manage_users', 'manage_subscriptions', 'view_analytics', 'system_settings']
    const existingPermissions = permissions ? permissions.map(p => p.permission) : []
    const missingPermissions = requiredPermissions.filter(p => !existingPermissions.includes(p))

    if (missingPermissions.length > 0) {
      console.log('➕ Ajout des permissions manquantes:', missingPermissions)
      
      const { error: addPermError } = await supabase
        .from('admin_permissions')
        .insert(
          missingPermissions.map(permission => ({
            user_id: adminId,
            permission
          }))
        )

      if (addPermError) {
        console.error('❌ Erreur ajout permissions:', addPermError)
      } else {
        console.log('✅ Permissions ajoutées!')
      }
    }

    // 3. Vérification finale
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminId)
      .single()

    const { data: finalPermissions } = await supabase
      .from('admin_permissions')
      .select('permission')
      .eq('user_id', adminId)

    console.log('\n🎉 Configuration finale:')
    console.log('👤 Nom:', finalProfile.full_name)
    console.log('📧 Email:', finalProfile.email)
    console.log('👨‍💼 Rôle:', finalProfile.role)
    console.log('🌐 Langue:', finalProfile.preferred_language)
    console.log('🛠️  Permissions:', finalPermissions.map(p => p.permission))
    
    console.log('\n🔑 Identifiants de connexion:')
    console.log('📧 Email: admin@example.com')
    console.log('🔐 Mot de passe: Admin123!@#')
    console.log('🌐 URL: https://aistrat360.vercel.app/fr/login')

  } catch (error) {
    console.error('💥 Erreur:', error)
  }
}

fixAdmin()