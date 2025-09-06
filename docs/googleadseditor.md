# 📊 Guide Google Ads Editor - Structure des fichiers Excel/CSV pour import bulk

## 🎯 Vue d'ensemble

Ce guide décrit la structure des fichiers Excel/CSV que l'application AIStrat360 génère pour l'import bulk dans **Google Ads Editor** (version 2025). Ces fichiers permettent de créer rapidement des campagnes Search et Performance Max optimisées basées sur l'analyse des mots-clés.

## 📅 Dernière mise à jour : Janvier 2025

---

## 🎯 Objectifs de campagne Google Ads (2025)

### Objectifs principaux disponibles

1. **Sales (Ventes)** 💰
   - Générer des ventes en ligne, in-app, par téléphone ou en magasin
   - Idéal pour : E-commerce, services avec conversion directe

2. **Leads (Prospects)** 📧
   - Obtenir des leads et conversions par formulaires
   - Idéal pour : B2B, services professionnels, formations

3. **Website Traffic (Trafic)** 🌐
   - Attirer les bonnes personnes sur votre site
   - Idéal pour : Contenu, blogs, sites informationnels

4. **Awareness & Consideration (Notoriété)** 👁️
   - Construire la notoriété de marque et atteindre une large audience
   - Idéal pour : Nouveaux produits, branding

5. **Local Store Visits (Visites magasin)** 🏪
   - Générer du trafic vers les points de vente physiques
   - Idéal pour : Retail, restaurants, services locaux

---

## 📁 Structure du fichier Excel pour Google Ads Editor

### 🔧 Configuration technique

- **Format** : CSV (UTF-8) ou Excel (.xlsx)
- **Encodage** : UTF-8 pour éviter les problèmes de caractères spéciaux
- **Première ligne** : Headers obligatoires (ne pas modifier)
- **Séparateur CSV** : Virgule (,) ou point-virgule (;) selon région

### 📑 Feuilles du fichier Excel

#### **Feuille 1 : Campaigns**

| Column Header | Description | Exemple | Requis |
|--------------|-------------|---------|--------|
| Campaign | Nom de la campagne | FR_Search_Chaussures_2025 | ✅ |
| Campaign Type | Type de campagne | Search / Performance Max | ✅ |
| Campaign Status | Statut | Enabled / Paused | ✅ |
| Campaign Daily Budget | Budget quotidien | 50.00 | ✅ |
| Networks | Réseaux | Google search;Search partners | ✅ |
| Languages | Langues ciblées | French;English | ✅ |
| Locations | Zones géographiques | France;Canada | ✅ |
| Bid Strategy Type | Stratégie d'enchères | Maximize conversions | ✅ |
| Start Date | Date de début | 2025-01-15 | ❌ |
| End Date | Date de fin | 2025-12-31 | ❌ |
| Campaign Goal | Objectif | Sales / Leads / Traffic | ✅ |
| Target CPA | CPA cible | 25.00 | ❌ |
| Target ROAS | ROAS cible | 400% | ❌ |

#### **Feuille 2 : Ad Groups**

| Column Header | Description | Exemple | Requis |
|--------------|-------------|---------|--------|
| Campaign | Nom de la campagne parent | FR_Search_Chaussures_2025 | ✅ |
| Ad Group | Nom du groupe d'annonces | Chaussures_Running_Homme | ✅ |
| Ad Group Type | Type | Standard | ✅ |
| Ad Group Status | Statut | Enabled | ✅ |
| Max CPC | Enchère max CPC | 2.50 | ❌ |
| Target CPA | CPA cible groupe | 30.00 | ❌ |
| Targeting Method | Méthode de ciblage | Keywords | ✅ |

#### **Feuille 3 : Keywords**

| Column Header | Description | Exemple | Requis |
|--------------|-------------|---------|--------|
| Campaign | Nom de la campagne | FR_Search_Chaussures_2025 | ✅ |
| Ad Group | Nom du groupe d'annonces | Chaussures_Running_Homme | ✅ |
| Keyword | Mot-clé | chaussures running homme | ✅ |
| Match Type | Type de correspondance | Broad / Phrase / Exact | ✅ |
| Max CPC | Enchère max | 1.75 | ❌ |
| Status | Statut | Enabled | ✅ |
| Final URL | URL de destination | https://site.com/running | ❌ |
| Quality Score | Score de qualité (lecture) | 8/10 | ❌ |
| Monthly Volume | Volume mensuel | 12000 | ❌ |
| Competition | Concurrence | Low / Medium / High | ❌ |
| Suggested Bid | Enchère suggérée | 1.50 | ❌ |

#### **Feuille 4 : Responsive Search Ads**

| Column Header | Description | Exemple | Requis |
|--------------|-------------|---------|--------|
| Campaign | Nom de la campagne | FR_Search_Chaussures_2025 | ✅ |
| Ad Group | Nom du groupe d'annonces | Chaussures_Running_Homme | ✅ |
| Status | Statut de l'annonce | Enabled | ✅ |
| Headline 1 | Titre 1 (30 car max) | Chaussures Running Pro | ✅ |
| Headline 2 | Titre 2 | Livraison Gratuite 24h | ✅ |
| Headline 3 | Titre 3 | -20% Premier Achat | ✅ |
| Headline 4-15 | Titres supplémentaires | ... | ❌ |
| Description 1 | Description 1 (90 car) | Découvrez notre sélection... | ✅ |
| Description 2 | Description 2 | Plus de 500 modèles... | ✅ |
| Description 3-4 | Descriptions supplémentaires | ... | ❌ |
| Final URL | URL de destination | https://site.com/running | ✅ |
| Display URL Path 1 | Chemin affiché 1 | Running | ❌ |
| Display URL Path 2 | Chemin affiché 2 | Homme | ❌ |

#### **Feuille 5 : Extensions (Optionnel)**

| Column Header | Description | Exemple | Requis |
|--------------|-------------|---------|--------|
| Campaign | Nom de la campagne | FR_Search_Chaussures_2025 | ✅ |
| Extension Type | Type d'extension | Sitelink / Callout / Call | ✅ |
| Extension Text | Texte de l'extension | Contactez-nous | ✅ |
| Extension URL | URL (si applicable) | https://site.com/contact | ❌ |
| Extension Description | Description | Service client 7j/7 | ❌ |

---

## 🚀 Campagnes Performance Max

### Structure spécifique pour Performance Max

#### **Feuille PMax : Asset Groups**

| Column Header | Description | Exemple | Requis |
|--------------|-------------|---------|--------|
| Campaign | Nom campagne PMax | FR_PMax_Ecommerce_2025 | ✅ |
| Asset Group Name | Nom du groupe | Chaussures_Sport | ✅ |
| Status | Statut | Enabled | ✅ |
| Final URL | URL principale | https://site.com | ✅ |

#### **Feuille PMax : Text Assets**

| Column Header | Description | Exemple | Requis |
|--------------|-------------|---------|--------|
| Campaign | Nom campagne PMax | FR_PMax_Ecommerce_2025 | ✅ |
| Asset Group | Groupe d'assets | Chaussures_Sport | ✅ |
| Asset Type | Type d'asset | Headline / Description | ✅ |
| Asset Text | Texte | Chaussures de qualité | ✅ |
| Performance Label | Label performance | Primary / | ❌ |

---

## 💡 Bonnes pratiques pour l'import

### ✅ Avant l'import

1. **Validation des données**
   - Vérifier l'absence de caractères spéciaux problématiques
   - S'assurer que les URLs sont valides et accessibles
   - Contrôler les limites de caractères (titres: 30, descriptions: 90)

2. **Naming convention**
   - Format recommandé : `[Pays]_[Type]_[Catégorie]_[Année]`
   - Exemple : `FR_Search_Chaussures_2025`

3. **Budgets et enchères**
   - Commencer avec des budgets conservateurs
   - Utiliser les enchères automatiques au départ

### 📊 Métriques à inclure (pour référence)

- **Volume de recherche** : Nombre de recherches mensuelles
- **CPC moyen** : Coût par clic estimé
- **Concurrence** : Niveau de compétition (Low/Medium/High)
- **Score de pertinence** : Pertinence du mot-clé pour le site

---

## 🔄 Process d'import dans Google Ads Editor

1. **Télécharger Google Ads Editor** (dernière version 2025)
2. **Se connecter** au compte Google Ads
3. **Menu** : Account > Import > From file
4. **Sélectionner** le fichier CSV/Excel généré
5. **Preview** : Vérifier les changements proposés
6. **Review** : Corriger les erreurs éventuelles
7. **Post** : Publier les changements

---

## 🎯 Mapping Objectifs → Type de campagne

| Objectif Business | Type Campagne Recommandé | Stratégie d'enchères |
|------------------|-------------------------|---------------------|
| **Ventes E-commerce** | Performance Max | Maximize conversion value |
| **Génération de leads** | Search | Maximize conversions |
| **Trafic qualifié** | Search | Maximize clicks (avec CPC max) |
| **Notoriété locale** | Performance Max + Local | Target impression share |
| **Branding** | Display + Video | Target CPM |

---

## 📈 Optimisations post-import

### Semaine 1-2
- Monitorer les impressions et CTR
- Ajuster les budgets si nécessaire
- Pauser les mots-clés non performants

### Semaine 3-4
- Analyser les conversions
- Optimiser les enchères
- Ajouter des mots-clés négatifs

### Mois 2+
- A/B testing des annonces
- Expansion des mots-clés performants
- Ajustement des stratégies d'enchères

---

## ⚠️ Limitations et contraintes

- **Titres RSA** : Maximum 15, minimum 3
- **Descriptions RSA** : Maximum 4, minimum 2
- **Budget minimum** : 10€/jour recommandé
- **Performance Max** : Minimum 7 jours d'apprentissage
- **Modifications** : Éviter les changements majeurs pendant l'apprentissage

---

## 🔗 Ressources supplémentaires

- [Google Ads Editor Help Center](https://support.google.com/google-ads/editor)
- [Templates officiels Google](https://support.google.com/google-ads/answer/10702525)
- [Guide Performance Max 2025](https://support.google.com/google-ads/topic/10703434)

---

*Ce document est généré automatiquement par AIStrat360 pour faciliter la création de campagnes Google Ads optimisées basées sur l'analyse de mots-clés et la profitabilité estimée.*