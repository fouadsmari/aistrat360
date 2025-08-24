# 🚀 Application SaaS - AIStrat360

Une application SaaS moderne construite avec Next.js 15, TypeScript et shadcn/ui.

## ✨ Fonctionnalités

### 🔐 Authentification
- Page de login moderne et responsive
- Design avec dégradés violets et animations
- Support du mode sombre
- Authentification sociale (Google, GitHub)

### 📊 Dashboards Multiples
- **Dashboard Utilisateurs** (`/dashboard`) - Interface violet pour les abonnés
- **Dashboard Admin** (`/admin/dashboard`) - Interface rouge/orange pour l'administration

### 🎨 Interface Utilisateur
- Design moderne et responsive
- Mode sombre/clair automatique
- Animations fluides et interactions
- Composants shadcn/ui exclusivement

### 🏗️ Architecture
- Next.js 15 avec App Router
- TypeScript pour la sécurité des types
- Tailwind CSS pour le styling
- Composants shadcn/ui

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour production
npm run build

# Lancer en production
npm start
```

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Mode développement
npm run build        # Build production
npm run start        # Serveur production
npm run lint         # Vérification ESLint
npm run type-check   # Vérification TypeScript
npm run validate     # TypeScript + ESLint + Format
npm run check-deploy # Validation complète + build
```

## 📱 Pages Disponibles

- `/login` - Page de connexion
- `/dashboard` - Dashboard utilisateurs
- `/admin/dashboard` - Dashboard administrateur

## 🎯 Technologies Utilisées

- **Framework**: Next.js 15.5.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4+
- **Composants**: shadcn/ui
- **Icônes**: Lucide React
- **Thème**: next-themes

## 🌟 Caractéristiques Techniques

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Mode sombre/clair
- ✅ Sidebar collapsible
- ✅ Navigation adaptative
- ✅ Animations et transitions
- ✅ Code TypeScript strict
- ✅ ESLint et Prettier configurés

## 📦 Structure du Projet

```
├── app/                    # Pages Next.js (App Router)
│   ├── admin/             # Dashboard administrateur
│   ├── dashboard/         # Dashboard utilisateurs (défaut)
│   ├── login/            # Page de connexion
│   └── layout.tsx        # Layout racine
├── components/           # Composants réutilisables
│   ├── layout/          # Composants de layout
│   ├── providers/       # Providers (theme, etc.)
│   └── ui/              # Composants shadcn/ui
├── lib/                 # Utilitaires
└── docs/               # Documentation

```

## 🔧 Configuration

Le projet utilise :
- `tailwind.config.ts` - Configuration Tailwind CSS
- `components.json` - Configuration shadcn/ui
- `tsconfig.json` - Configuration TypeScript
- `.eslintrc.json` - Configuration ESLint

## 🚀 Déploiement

L'application est prête pour le déploiement sur Vercel, Netlify ou tout autre hébergeur compatible Next.js.

---

**Développé avec ❤️ par Fouad Smari**