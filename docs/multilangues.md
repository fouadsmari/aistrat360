# Architecture Multilingue - AIStrat360

## Vue d'ensemble

Cette application utilise **next-intl** avec Next.js 15 pour gérer l'internationalisation (i18n). L'architecture est basée sur la structure App Router avec des segments [locale] dynamiques.

## Configuration de base

### 1. Langues supportées

```typescript
// src/i18n/routing.ts
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
})
```

### 2. Structure des dossiers

```
app/
├── [locale]/                    # Segment dynamique pour les langues
│   ├── layout.tsx              # Layout principal avec NextIntlClientProvider
│   ├── page.tsx                # Page d'accueil
│   ├── dashboard/              # Pages protégées
│   ├── admin/                  # Pages admin
│   ├── tools/                  # Outils (keywords, etc.)
│   └── ...autres pages
├── api/                        # Routes API (sans locale)
├── globals.css
├── layout.tsx                  # Root layout (redirection)
└── page.tsx                    # Root page (redirection)

messages/
├── fr.json                     # Traductions françaises
└── en.json                     # Traductions anglaises

src/i18n/
├── routing.ts                  # Configuration des routes
└── request.ts                  # Configuration des messages
```

### 3. Configuration Next.js

```typescript
// next.config.ts
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

export default withNextIntl(nextConfig)
```

## Middleware de routage

```typescript
// middleware.ts
import createMiddleware from "next-intl/middleware"
import { routing } from "./src/i18n/routing"

const intlMiddleware = createMiddleware(routing)

export async function middleware(req: NextRequest) {
  // 1. Gestion i18n en premier
  let response = intlMiddleware(req)

  // 2. Puis authentification Supabase
  // 3. Puis protection des routes

  return response
}
```

## Structure des traductions

### Organisation hiérarchique

```json
{
  "common": {
    "loading": "Chargement...",
    "save": "Enregistrer",
    "cancel": "Annuler"
  },
  "auth": {
    "login": "Connexion",
    "signup": "Inscription"
  },
  "dashboard": {
    "title": "Tableau de bord",
    "statistics": {
      "totalRevenue": "Chiffre d'affaires total"
    }
  },
  "tools": {
    "keywords": {
      "title": "Analyse de mots-clés",
      "results": {
        "overview": "Vue d'ensemble",
        "keywords": "Mots-clés",
        "grouped": {
          "title": "Mots-clés par Page",
          "totalPages": "Pages totales"
        }
      }
    }
  }
}
```

### Conventions de nommage

1. **Sections principales** : `auth`, `dashboard`, `admin`, `tools`
2. **Sous-sections** : `tools.keywords`, `tools.analytics`
3. **Composants** : `tools.keywords.results`, `tools.keywords.analysis`
4. **Actions communes** : Toujours dans `common`

## Utilisation dans les composants

### Hook de base

```typescript
import { useTranslations } from "next-intl"

export function MyComponent() {
  const t = useTranslations("dashboard")

  return <h1>{t("title")}</h1>
}
```

### Traductions imbriquées

```typescript
const t = useTranslations("tools.keywords.results")

return (
  <div>
    <h2>{t("overview")}</h2>
    <p>{t("grouped.title")}</p>
  </div>
)
```

### Navigation multilingue

```typescript
import { useParams } from "next/navigation"
import Link from "next/link"

export function Navigation() {
  const params = useParams()
  const locale = params.locale as string

  const menuItems = [
    { href: `/${locale}/dashboard`, label: t("dashboard") },
    { href: `/${locale}/tools/keywords`, label: t("tools.keywords.title") }
  ]

  return (
    <nav>
      {menuItems.map(item => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
```

## Routes et URLs

### Structure des URLs

- Français : `/fr/dashboard`, `/fr/tools/keywords`
- Anglais : `/en/dashboard`, `/en/tools/keywords`
- Défaut : Redirection vers `/fr/...`

### Génération des paramètres statiques

```typescript
// app/[locale]/layout.tsx
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}
```

## Bonnes pratiques

### 1. Organisation des clés

```typescript
// ✅ Bon : Organisation hiérarchique claire
{
  "tools": {
    "keywords": {
      "title": "Analyse de mots-clés",
      "results": {
        "overview": "Vue d'ensemble"
      }
    }
  }
}

// ❌ Éviter : Clés plates et longues
{
  "toolsKeywordsTitle": "Analyse de mots-clés",
  "toolsKeywordsResultsOverview": "Vue d'ensemble"
}
```

### 2. Réutilisation des traductions communes

```typescript
// ✅ Utilisez common pour les actions répétées
const t = useTranslations("common")
<Button>{t("save")}</Button>

// ✅ Utilisez la section spécifique pour le contenu
const tKeywords = useTranslations("tools.keywords")
<h1>{tKeywords("title")}</h1>
```

### 3. Gestion des pluriels et variables

```json
{
  "resultsCount": "{count, plural, =0 {Aucun résultat} =1 {1 résultat} other {# résultats}}",
  "welcome": "Bienvenue, {name}"
}
```

### 4. URLs localisées

Pour des URLs avec noms localisés, utilisez un mapping :

```typescript
const routeMapping = {
  fr: {
    sites: "sites",
    keywords: "mots-cles",
  },
  en: {
    sites: "websites",
    keywords: "keywords",
  },
}
```

## Checklist pour nouvelles pages

Lors de la création d'une nouvelle page, vérifiez :

- [ ] Page créée dans `app/[locale]/...`
- [ ] Traductions ajoutées dans `messages/fr.json` et `messages/en.json`
- [ ] Hook `useTranslations` utilisé avec la bonne section
- [ ] Navigation mise à jour avec les URLs localisées
- [ ] Tests de navigation entre les langues
- [ ] Validation que `setRequestLocale(locale)` est appelé pour les pages statiques

## Exemple complet : Nouvelle page "Sites"

### 1. Structure des fichiers

```
app/[locale]/sites/
├── page.tsx                    # Page principale
├── layout.tsx                 # Layout spécifique (optionnel)
└── [id]/
    └── page.tsx               # Page de détail
```

### 2. Traductions

```json
// messages/fr.json
{
  "sites": {
    "title": "Mes Sites",
    "add": "Ajouter un site",
    "list": {
      "empty": "Aucun site configuré",
      "total": "{count} sites"
    }
  }
}

// messages/en.json
{
  "sites": {
    "title": "My Websites",
    "add": "Add website",
    "list": {
      "empty": "No websites configured",
      "total": "{count} websites"
    }
  }
}
```

### 3. Composant

```typescript
// app/[locale]/sites/page.tsx
import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"

export default function SitesPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = useTranslations("sites")

  return (
    <div>
      <h1>{t("title")}</h1>
      <button>{t("add")}</button>
    </div>
  )
}
```

Cette architecture garantit une internationalisation robuste et maintenable pour toute l'application.
