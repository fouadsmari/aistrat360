# 📊 Analyse DataForSEO - Quartier Metta

## 🔧 Détails de l'Appel API

- **Endpoint utilisé:** `on_page/instant_pages`
- **URL:** `https://api.dataforseo.com/v3/on_page/instant_pages`
- **Méthode:** POST
- **URL analysée:** `https://quartiermetta.com/`
- **Paramètres activés:**
  - `enable_javascript`: true
  - `enable_browser_rendering`: true
  - `load_resources`: true

## 💰 Coût et Performance

- **Coût de l'analyse:** 0.00425$ (environ 0,004€)
- **Temps d'exécution:** 10.45 secondes
- **Statut:** Succès (20000)

## 📝 Réponse Complète DataForSEO

```json
{
  "version": "0.1.20250828",
  "status_code": 20000,
  "status_message": "Ok.",
  "time": "10.5478 sec.",
  "cost": 0.00425,
  "tasks_count": 1,
  "tasks_error": 0,
  "tasks": [
    {
      "id": "08310536-2736-0275-0000-2ab83135a6b6",
      "status_code": 20000,
      "status_message": "Ok.",
      "time": "10.4450 sec.",
      "cost": 0.00425,
      "result_count": 1,
      "path": ["v3", "on_page", "instant_pages"],
      "data": {
        "api": "on_page",
        "function": "instant_pages",
        "url": "https://quartiermetta.com/",
        "enable_javascript": true,
        "enable_browser_rendering": true,
        "load_resources": true
      },
      "result": [
        {
          "crawl_progress": "finished",
          "crawl_status": null,
          "crawl_gateway_address": "168.119.141.170",
          "items_count": 1,
          "items": [
            {
              "resource_type": "html",
              "status_code": 200,
              "location": null,
              "url": "https://quartiermetta.com/",
              "meta": {
                "title": "Accueil - Quartier Metta",
                "charset": 65001,
                "follow": true,
                "generator": "Site Kit by Google 1.159.0",
                "htags": {
                  "h4": [
                    "VOTRE QUARTIER RÉSIDENTIEL CONNECTÉ",
                    "Pavillon des ventes",
                    "Restez informés",
                    "UN PROJET DE",
                    "SUIVEZ-NOUS"
                  ],
                  "h2": [
                    "LE QUARTIER METTA",
                    "EN PLEIN ESSOR.",
                    "UN EMPLACEMENT STRATÉGIQUE, UNE CONNECTIVITÉ FLUIDE.",
                    "VOTRE MAISON IDÉALE VOUS ATTEND AU QUARTIER METTA.",
                    "Maisons de ville",
                    "Maisons unifamiliales",
                    "Maisons en rangée"
                  ],
                  "h1": ["VISITE VIRTUELLE"]
                },
                "description": "Trouvez votre maison neuve à Laval dans le Quartier Metta près de la Station REM Ste-Dorothée. Metta vous propose un ensemble élégant de maisons de ville, maisons unifamiliales et maisons en rangée intégrées à l'environnement enchanteur des terrains de golf Le Cardinal et Islesmere.",
                "favicon": "https://quartiermetta.com/wp-content/uploads/2020/08/cropped-favicon-32x32.png",
                "meta_keywords": null,
                "canonical": "https://quartiermetta.com/",
                "internal_links_count": 18,
                "external_links_count": 4,
                "inbound_links_count": 0,
                "images_count": 14,
                "images_size": 36046458,
                "scripts_count": 26,
                "scripts_size": 1472439,
                "stylesheets_count": 15,
                "stylesheets_size": 1001951,
                "title_length": 24,
                "description_length": 283,
                "render_blocking_scripts_count": 1,
                "render_blocking_stylesheets_count": 0,
                "cumulative_layout_shift": 0.05079303743024912,
                "meta_title": null,
                "content": {
                  "plain_text_size": 3029,
                  "plain_text_rate": 0.022553143963366964,
                  "plain_text_word_count": 484,
                  "automated_readability_index": 14.334739275875634,
                  "coleman_liau_readability_index": 13.178264462809913,
                  "dale_chall_readability_index": 16.443802400629675,
                  "flesch_kincaid_readability_index": 33.357573789846526,
                  "smog_readability_index": 15.532846611407376,
                  "description_to_content_consistency": 0.8918918967247009,
                  "title_to_content_consistency": 0.6666666865348816,
                  "meta_keywords_to_content_consistency": null
                },
                "deprecated_tags": null,
                "duplicate_meta_tags": ["generator"],
                "spell": null,
                "social_media_tags": {
                  "og:locale": "fr_CA",
                  "og:type": "website",
                  "og:title": "Accueil - Quartier Metta",
                  "og:description": "Trouvez votre maison neuve à Laval dans le Quartier Metta près de la Station REM Ste-Dorothée. Metta vous propose un ensemble élégant de maisons de ville, maisons unifamiliales et maisons en rangée intégrées à l'environnement enchanteur des terrains de golf Le Cardinal et Islesmere.",
                  "og:url": "https://quartiermetta.com/",
                  "og:site_name": "Quartier Metta",
                  "article:modified_time": "2025-05-26T15:27:23+00:00",
                  "twitter:card": "summary_large_image"
                }
              },
              "page_timing": {
                "time_to_interactive": 3454,
                "dom_complete": 3833,
                "largest_contentful_paint": 3564,
                "first_input_delay": 44.6205,
                "connection_time": 66,
                "time_to_secure_connection": 13,
                "request_sent_time": 0,
                "waiting_time": 2471,
                "download_time": 185,
                "duration_time": 3837,
                "fetch_start": 0,
                "fetch_end": 3837
              },
              "onpage_score": 86.36,
              "total_dom_size": 40084549,
              "custom_js_response": null,
              "custom_js_client_exception": null,
              "resource_errors": {
                "errors": null,
                "warnings": [
                  {
                    "line": 1,
                    "column": 46,
                    "message": "Has node with more than 60 childs.",
                    "status_code": 1
                  }
                ]
              },
              "broken_resources": false,
              "broken_links": false,
              "duplicate_title": false,
              "duplicate_description": false,
              "duplicate_content": false,
              "click_depth": 0,
              "size": 134488,
              "encoded_size": 22346,
              "total_transfer_size": 22346,
              "fetch_time": "2025-08-31 02:37:07 +00:00",
              "cache_control": {
                "cachable": false,
                "ttl": 0
              },
              "checks": {
                "no_content_encoding": false,
                "high_loading_time": true,
                "from_sitemap": false,
                "is_redirect": false,
                "is_4xx_code": false,
                "is_5xx_code": false,
                "is_broken": false,
                "is_www": false,
                "is_https": true,
                "is_http": false,
                "high_waiting_time": true,
                "has_micromarkup": false,
                "has_micromarkup_errors": false,
                "no_doctype": false,
                "has_html_doctype": true,
                "canonical": true,
                "no_encoding_meta_tag": false,
                "no_h1_tag": false,
                "https_to_http_links": false,
                "size_greater_than_3mb": false,
                "meta_charset_consistency": true,
                "has_meta_refresh_redirect": false,
                "has_render_blocking_resources": true,
                "low_content_rate": true,
                "high_content_rate": false,
                "low_character_count": false,
                "high_character_count": false,
                "small_page_size": false,
                "large_page_size": false,
                "low_readability_rate": false,
                "irrelevant_description": false,
                "irrelevant_title": false,
                "irrelevant_meta_keywords": false,
                "title_too_long": false,
                "has_meta_title": false,
                "title_too_short": true,
                "deprecated_html_tags": false,
                "duplicate_meta_tags": true,
                "duplicate_title_tag": false,
                "no_image_alt": true,
                "no_image_title": true,
                "no_description": false,
                "no_title": false,
                "no_favicon": false,
                "seo_friendly_url": true,
                "flash": false,
                "frame": true,
                "lorem_ipsum": false,
                "seo_friendly_url_characters_check": true,
                "seo_friendly_url_dynamic_check": true,
                "seo_friendly_url_keywords_check": true,
                "seo_friendly_url_relative_length_check": true
              },
              "content_encoding": "zstd",
              "media_type": "text/html",
              "server": "cloudflare",
              "is_resource": false,
              "url_length": 26,
              "relative_url_length": 1,
              "last_modified": {
                "header": null,
                "sitemap": null,
                "meta_tag": "2025-05-26 15:27:23 +00:00"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 📊 Analyse Détaillée des Résultats

### 🎯 Métadonnées Principales

- **Titre:** "Accueil - Quartier Metta" (24 caractères)
- **Description:** "Trouvez votre maison neuve à Laval dans le Quartier Metta près de la Station REM Ste-Dorothée..." (283 caractères)
- **URL canonique:** https://quartiermetta.com/
- **Langue détectée:** Français canadien (fr_CA)

### 📈 Score SEO Global

- **OnPage Score:** 86.36/100 (Excellent)

### 🏗️ Structure du Contenu

- **H1:** "VISITE VIRTUELLE"
- **H2 (7 titres):**
  - "LE QUARTIER METTA"
  - "EN PLEIN ESSOR"
  - "UN EMPLACEMENT STRATÉGIQUE..."
  - "VOTRE MAISON IDÉALE..."
  - "Maisons de ville"
  - "Maisons unifamiliales"
  - "Maisons en rangée"
- **H4 (5 titres):** Informations de contact et projet

### 📝 Analyse du Contenu

- **Nombre de mots:** 484
- **Taille du texte:** 3,029 octets
- **Taux de contenu/HTML:** 2.26% (faible)
- **Cohérence description/contenu:** 89.19% (excellente)
- **Cohérence titre/contenu:** 66.67% (bonne)

### 🎓 Indices de Lisibilité

- **Flesch-Kincaid:** 33.36 (difficile)
- **Coleman-Liau:** 13.18 (niveau universitaire)
- **Dale-Chall:** 16.44 (très difficile)
- **SMOG:** 15.53 (niveau universitaire)

### 🔗 Analyse des Liens

- **Liens internes:** 18
- **Liens externes:** 4
- **Liens entrants:** 0
- **Liens cassés:** Non

### 🖼️ Ressources Médias

- **Images:** 14 (36 MB - très lourd!)
- **Scripts:** 26 (1.47 MB)
- **Feuilles de style:** 15 (1 MB)
- **Favicon:** Présent

### ⚡ Performance

- **Time to Interactive:** 3.45 secondes
- **Largest Contentful Paint:** 3.56 secondes
- **DOM Complete:** 3.83 secondes
- **Temps de chargement total:** 3.84 secondes
- **Taille totale DOM:** 40 MB (très lourd!)

### 🚨 Problèmes Détectés

- **Titre trop court:** Oui (24 caractères)
- **Images sans alt text:** Oui
- **Images sans titre:** Oui
- **Temps de chargement élevé:** Oui
- **Ressources bloquant le rendu:** 1 script
- **Taux de contenu bas:** Oui (2.26%)
- **Tags méta dupliqués:** "generator"
- **Présence de frames:** Oui

### 📱 Réseaux Sociaux

- **Open Graph:** Configuré correctement
- **Twitter Card:** summary_large_image
- **Locale:** fr_CA

### 🔧 Informations Techniques

- **Serveur:** Cloudflare
- **HTTPS:** Oui
- **Encodage:** UTF-8 (65001)
- **Content Encoding:** zstd
- **Dernière modification:** 26 mai 2025

### 💡 Recommandations Clés

1. **Optimiser les images** (36 MB est beaucoup trop lourd)
2. **Ajouter des alt text** aux images
3. **Augmenter le contenu textuel** (ratio très bas)
4. **Allonger le titre** (minimum 30-60 caractères)
5. **Optimiser le temps de chargement**
6. **Supprimer les ressources bloquantes**
