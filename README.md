# AIStrat360

🚀 **Plateforme SaaS moderne** pour la stratégie AI avec Next.js 15, Supabase, et système multilingue.

## ✨ Fonctionnalités

- 🔐 **Authentification** - Connexion sécurisée avec Supabase
- 👥 **Multi-rôles** - Admin et utilisateurs avec permissions
- 🌍 **Multilingue** - Interface FR/EN avec changement en temps réel
- 📱 **Responsive** - Design moderne avec mode sombre
- ⚡ **Performance** - SSG + ISR optimisé pour la production

## 🛠️ Stack technique

- **Framework** : Next.js 15 avec App Router
- **Backend** : Supabase (Auth + Database + RLS)
- **UI** : shadcn/ui + Tailwind CSS
- **Types** : TypeScript strict
- **I18n** : next-intl pour l'internationalisation
- **Tests** : Jest + Testing Library

## 🚀 Démarrage rapide

```bash
git clone https://github.com/fouadsmari/aistrat360.git
cd aistrat360
npm install
npm run dev
```

## 📋 Scripts disponibles

```bash
npm run dev          # Développement (localhost:3000)
npm run build        # Build production
npm run test         # Tests unitaires
npm run lint         # Vérification code
npm run check-deploy # Validation complète
```

## 📁 Structure

```
app/[locale]/        # Routes internationalisées
├── admin/          # Dashboard administrateur
├── dashboard/      # Dashboard utilisateur
├── login/          # Authentification
└── profile/        # Gestion profil
components/ui/       # Composants réutilisables
lib/                # Utilitaires et config
messages/           # Traductions FR/EN
```

## 🔑 Admin par défaut

```
Email: admin@example.com
Mot de passe: Admin123!@#
```

## 🌐 URLs

- **Français** : `/fr/*`
- **Anglais** : `/en/*`
- **Admin** : `/[locale]/admin/dashboard`
- **Utilisateur** : `/[locale]/dashboard`

---

**Développé avec ❤️ par [Claude Code](https://claude.ai/code)**
