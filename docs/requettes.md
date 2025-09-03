# 🔍 Analyse des Requêtes DataForSEO

## 📋 Vue d'ensemble

Ce document détaille toutes les requêtes envoyées à l'API DataForSEO lors d'une analyse de mots-clés, leurs coûts associés et les outils utilisés.

## 🚀 Processus d'analyse complet

### Phase 1 : Récupération du contenu HTML (20%)

**Endpoint utilisé :** `/v3/on_page/instant_pages`
**Méthode :** POST
**Coût :** Variable selon le plan DataForSEO

```json
{
  "url": "https://example.com",
  "enable_javascript": true,
  "enable_browser_rendering": true,
  "load_resources": true
}
```

**Objectif :** Récupérer le contenu HTML complet du site web pour l'extraction de mots-clés seed.

---

### Phase 2 : Analyse des mots-clés classés (40%-60%)

**Endpoint utilisé :** `/v3/dataforseo_labs/google/ranked_keywords/live`
**Méthode :** POST
**Coût :** $0.11 pour 1000 mots-clés (limité à 900 = ~$0.099)

```json
{
  "target": "example.com",
  "location_code": 2250,
  "language_code": "fr",
  "limit": 900,
  "offset": 0,
  "filters": [["keyword_data.keyword_info.search_volume", ">", 10]],
  "order_by": ["keyword_data.keyword_info.search_volume,desc"]
}
```

**Objectif :** Récupérer tous les mots-clés pour lesquels le domaine est actuellement classé dans Google.

**Paramètres par pays :**

- 🇫🇷 France : location_code: 2250, language_code: "fr"
- 🇨🇦 Canada : location_code: 2124, language_code: "fr" ou "en"
- 🇺🇸 États-Unis : location_code: 2840, language_code: "en"
- 🇧🇪 Belgique : location_code: 2056, language_code: "fr" ou "nl"
- 🇨🇭 Suisse : location_code: 2756, language_code: "fr" ou "de"
- 🇬🇧 Royaume-Uni : location_code: 2826, language_code: "en"
- 🇩🇪 Allemagne : location_code: 2276, language_code: "de"
- 🇪🇸 Espagne : location_code: 2724, language_code: "es"
- 🇮🇹 Italie : location_code: 2380, language_code: "it"

---

### Phase 3 : Idées de mots-clés (60%-80%)

**Endpoint utilisé :** `/v3/dataforseo_labs/google/keyword_ideas/live`
**Méthode :** POST
**Coût :** $0.0115 par requête (une seule requête pour tous les mots-clés)

```json
{
  "keywords": ["mot-clé-1", "mot-clé-2", "mot-clé-3", "...", "mot-clé-10"],
  "location_code": 2250,
  "language_code": "fr",
  "limit": 199,
  "include_serp_info": true,
  "filters": [
    ["keyword_data.search_volume", ">", 50],
    ["keyword_data.keyword_difficulty", "<", 80]
  ],
  "order_by": ["keyword_data.search_volume,desc"]
}
```

**Objectif :** Générer des idées de mots-clés intelligentes basées sur les catégories Google Ads et les mots-clés principaux extraits du site.

**Avantages par rapport à keyword_suggestions :**

- ✅ Une seule requête pour jusqu'à 10 mots-clés seed
- ✅ Algorithme plus intelligent basé sur les catégories Google Ads
- ✅ Jusqu'à 199 idées par requête (vs 100 suggestions)
- ✅ Coût réduit (1 requête vs 3+ requêtes)

---

## 💰 Calcul des coûts par analyse

### Coût total optimisé par analyse :

```
Coût HTML : Variable (inclus dans le plan)
Coût Mots-clés classés : (900/1000) × $0.11 = ~$0.03
Coût Idées de mots-clés : $0.0299 (optimisé)
TOTAL = ~$0.06 par analyse (50% économie vs $0.11 précédent)
```

### **WORKFLOW RÉVOLUTIONNAIRE** :

1. **ranked_keywords** → Récupère jusqu'à 900 mots-clés classés du site
2. **Sélection intelligente** → Prend les 199 meilleurs mots-clés comme seeds
3. **keyword_ideas** → Génère des suggestions basées sur ces 199 seeds réels
4. **Résultat** → Suggestions ultra-pertinentes basées sur le profil SEO réel du site

### Fonction de calcul (lib/dataforseo-client.ts:730) :

```typescript
calculateLabsCost(rankedKeywordsCount: number, suggestionsCount: number): number {
  const rankedCost = (rankedKeywordsCount / 1000) * 0.11
  const suggestionsCost = suggestionsCount > 0 ? 0.0115 : 0
  return rankedCost + suggestionsCost
}
```

---

## 🔧 Outils DataForSEO utilisés

### 1. **On-Page API**

- **Outil :** `instant_pages`
- **Usage :** Récupération du contenu HTML
- **Fréquence :** 1 requête par analyse

### 2. **DataForSEO Labs API - Ranked Keywords**

- **Outil :** `ranked_keywords`
- **Usage :** Mots-clés pour lesquels le site est classé
- **Fréquence :** 1 requête par analyse
- **Limite :** 900 mots-clés maximum

### 3. **DataForSEO Labs API - Keyword Ideas**

- **Outil :** `keyword_ideas`
- **Usage :** Idées de mots-clés intelligentes basées sur Google Ads
- **Fréquence :** 1 requête par analyse
- **Limite :** 199 idées maximum (optimisé)

---

## 📊 Structure des données retournées

### Mots-clés classés (ranked_keywords) :

```json
{
  "keyword_data": {
    "keyword": "exemple mot-clé",
    "keyword_info": {
      "search_volume": 1000,
      "cpc": 1.23,
      "keyword_difficulty": 45
    }
  },
  "ranked_serp_element": {
    "serp_item": {
      "rank_absolute": 5,
      "url": "https://example.com/page"
    }
  }
}
```

### Idées de mots-clés (keyword_ideas) :

```json
{
  "keyword_data": {
    "keyword": "nouveau mot-clé",
    "search_volume": 800,
    "keyword_difficulty": 35,
    "cpc": 0.89,
    "competition": 0.5
  },
  "serp_info": {
    "serp_item_types": ["organic", "ads"],
    "last_updated_time": "2025-09-03 10:30:00"
  }
}
```

---

## 🎯 Optimisations mises en place

### 1. **Cache intelligent**

- Durée : 90 jours pour les analyses Labs
- Clé unique basée sur : domaine + pays + langue + limite
- Réduction significative des coûts sur requêtes répétées

### 2. **Limites de sécurité**

- **Mots-clés classés :** Maximum 900 (pour rester sous $0.10)
- **Idées de mots-clés :** Maximum 199 par requête (optimisé)
- **Mots-clés seed :** Maximum 10 pour les idées (plus efficace)

### 3. **Filtres intelligents**

- Volume de recherche > 10 pour les mots-clés classés
- Volume de recherche > 50 pour les suggestions
- Difficulté < 80 pour exclure les mots-clés très difficiles

---

## 📈 Quotas et limitations

### Par plan d'abonnement :

- **Gratuit :** 3 analyses/mois
- **Starter :** 10 analyses/mois
- **Pro :** 50 analyses/mois
- **Advanced :** Illimité

### Coût mensuel estimé par plan :

- **Gratuit :** 3 × $0.11 = $0.33/mois
- **Starter :** 10 × $0.11 = $1.10/mois
- **Pro :** 50 × $0.11 = $5.50/mois
- **Advanced :** Variable selon usage

---

## 🚨 Points d'attention

### 1. **Gestion d'erreurs**

- Retry automatique sur erreurs temporaires
- Fallback gracieux si une API échoue
- Logs détaillés pour le debugging

### 2. **Monitoring des coûts**

- Calcul automatique du coût par analyse
- Stockage en base de données (`dataforseo_cost`)
- Surveillance des dépassements de budget

### 3. **Performance**

- Requêtes parallèles quand possible
- Cache agressif pour éviter les requêtes inutiles
- Timeout appropriés (10s par requête)

---

## 📝 Logs et debugging

### Variables d'environnement requises :

```bash
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
```

### Logs temporaires (à supprimer en production) :

```typescript
console.log(
  `[DEBUG] getRankedKeywords call - domain: ${domain}, country: ${location}`
)
console.log(`[DEBUG] DataForSEO response - status_code: ${data.status_code}`)
console.log(`[DEBUG] Task result count: ${data.tasks[0].result?.length || 0}`)
```

---

_Dernière mise à jour : 2025-09-03_
_Version : 1.0_
