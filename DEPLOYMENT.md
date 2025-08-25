# Guide de Déploiement Vercel

## 🚨 Problèmes actuels identifiés

### 1. Variables d'environnement manquantes sur Vercel

**Erreur:** `supabaseUrl is required`
**Cause:** Les variables d'environnement Supabase ne sont pas configurées sur Vercel

### 2. Pages 404 sur /fr et /fr/login  

**Cause:** Le middleware ne peut pas fonctionner sans les variables d'environnement Supabase

## ✅ Solutions

### Étape 1: Configurer les variables d'environnement Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet **aistrat360**
3. Allez dans **Settings > Environment Variables**
4. Ajoutez ces 2 variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://ypygrfrwpddqjbahgayc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweWdyZnJ3cGRkcWpiYWhnYXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNzc0OTksImV4cCI6MjA3MTY1MzQ5OX0.uez2gvTIVasuatFvfhRyuxFcIrVTFabDOEA2psAye2w
```

5. **Important:** Sélectionnez **Production**, **Preview** et **Development** pour chaque variable
6. Cliquez **Save**

### Étape 2: Redéployer

Après avoir ajouté les variables:
1. Allez dans **Deployments**
2. Cliquez sur **Redeploy** pour le dernier déploiement
3. Ou faites un nouveau commit et push

## 🎉 Test après déploiement

Une fois les variables ajoutées et redéployé:

1. **Page d'accueil:** https://aistrat360.vercel.app/ → doit rediriger vers `/fr`
2. **Page française:** https://aistrat360.vercel.app/fr → doit rediriger vers `/fr/login`
3. **Page de connexion:** https://aistrat360.vercel.app/fr/login → doit afficher le formulaire

### Identifiants admin

```
📧 Email: admin@example.com
🔐 Mot de passe: Admin123!@#
```

Après connexion admin → redirection vers `/fr/admin/dashboard`

## 🐛 Debug si ça ne marche toujours pas

Si les erreurs persistent:

1. Vérifiez dans Vercel **Functions** > **Logs** les erreurs de middleware
2. Ouvrez la console développeur sur la page pour voir les erreurs JavaScript
3. Vérifiez que les variables sont bien définies dans **Settings > Environment Variables**

## 📁 Structure des routes

```
https://aistrat360.vercel.app/
├── / → redirige vers /fr
├── /fr/
│   ├── login → Page de connexion
│   ├── dashboard → Redirige selon le rôle
│   ├── admin/dashboard → Dashboard admin
│   ├── user/dashboard → Dashboard utilisateur
│   └── profile → Profil utilisateur
└── /en/ → Même structure en anglais
```

## ⚡ Performance

- Pages pré-rendues avec SSG quand possible
- Middleware optimisé pour l'authentification
- Traductions chargées côté serveur
- Build optimisé pour la production