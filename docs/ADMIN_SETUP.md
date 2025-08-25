# Configuration du Profil Administrateur

## Étapes pour créer un utilisateur admin

### 1. Accéder au Dashboard Supabase
- Allez sur https://supabase.com/dashboard
- Connectez-vous à votre compte
- Sélectionnez votre projet

### 2. Appliquer les migrations de base de données
- Allez dans **Database > Migrations**
- Ou utilisez le SQL Editor pour exécuter les migrations manuellement
- Exécutez d'abord `001_create_users_tables.sql` si ce n'est pas déjà fait

### 3. Créer l'utilisateur admin dans Authentication
- Allez dans **Authentication > Users**
- Cliquez sur **"Invite user"** ou **"Add user"**
- Utilisez ces informations :
  - Email: `admin@example.com` (ou votre email préféré)
  - Mot de passe: Choisissez un mot de passe sécurisé
  - Email Confirm: `true` (confirmé)
- Copiez l'**ID utilisateur** généré (format UUID)

### 4. Configurer le profil admin
- Allez dans **Database > SQL Editor**
- Exécutez le script suivant en remplaçant `USER_ID_HERE` par l'ID réel :

```sql
-- Insérer le profil admin
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  preferred_language
) VALUES (
  'USER_ID_HERE', -- Remplacez par l'ID utilisateur réel
  'admin@example.com',
  'System Administrator',
  'admin',
  'fr'
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'System Administrator';

-- Ajouter les permissions admin
INSERT INTO admin_permissions (
  user_id,
  permission
) VALUES 
  ('USER_ID_HERE', 'manage_users'),
  ('USER_ID_HERE', 'manage_subscriptions'),
  ('USER_ID_HERE', 'view_analytics'),
  ('USER_ID_HERE', 'system_settings')
ON CONFLICT (user_id, permission) DO NOTHING;
```

### 5. Vérifier la configuration
Exécutez cette requête pour vérifier que tout est correct :

```sql
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.preferred_language,
  array_agg(ap.permission) as permissions
FROM profiles p
LEFT JOIN admin_permissions ap ON p.id = ap.user_id
WHERE p.role = 'admin'
GROUP BY p.id, p.email, p.full_name, p.role, p.preferred_language;
```

### 6. Test de connexion
- Allez sur votre application : `http://localhost:3000`
- La page d'accueil vous redirigera vers `/fr/login`
- Connectez-vous avec :
  - Email: `admin@example.com`
  - Mot de passe: celui que vous avez défini
- Vous devriez être redirigé vers `/fr/admin/dashboard`

## Variables d'environnement nécessaires

Assurez-vous que votre fichier `.env.local` contient :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Résolution de problèmes

### L'utilisateur n'est pas redirigé vers le dashboard admin
- Vérifiez que le rôle est bien défini à 'admin' dans la table profiles
- Vérifiez les permissions dans admin_permissions
- Consultez les logs dans la console du navigateur

### Erreur de connexion Supabase
- Vérifiez les variables d'environnement
- Vérifiez que les RLS policies sont activées
- Vérifiez que l'utilisateur est confirmé dans Authentication

### Problème de langue/localisation
- L'admin sera créé avec la langue française par défaut
- Il peut changer de langue dans `/fr/profile` ou `/en/profile`