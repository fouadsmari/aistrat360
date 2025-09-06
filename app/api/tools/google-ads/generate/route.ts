import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import OpenAI from "openai"
import { readFileSync } from "fs"
import { join } from "path"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

interface GenerateCampaignRequest {
  pageUrl: string
  pageTitle?: string
  keywords: Array<{
    keyword: string
    searchVolume: number
    cpc: number
    competition: number
    difficulty: number
    intent: string
  }>
  campaignType: "search" | "pmax" | "ai_recommended"
  websiteId: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: GenerateCampaignRequest = await req.json()
    const { pageUrl, pageTitle, keywords, campaignType, websiteId } = body

    // Resolve the correct website_id if needed
    let resolvedWebsiteId = websiteId

    // If websiteId looks like an analysis ID, fetch the correct website_id from the analysis
    if (websiteId && websiteId.includes("-")) {
      const { data: analysis } = await supabase
        .from("dataforseo_analyses")
        .select("website_id")
        .eq("id", websiteId)
        .eq("user_id", user.id)
        .single()

      if (analysis) {
        resolvedWebsiteId = analysis.website_id
        console.log(
          "Resolved websiteId from analysis:",
          websiteId,
          "->",
          analysis.website_id
        )
      }
    }

    // Validate input
    if (
      !pageUrl ||
      !keywords ||
      keywords.length === 0 ||
      !campaignType ||
      !resolvedWebsiteId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Load Google Ads Editor documentation
    const googleAdsEditorPath = join(
      process.cwd(),
      "docs",
      "googleadseditor.md"
    )
    const googleAdsEditorContent = readFileSync(googleAdsEditorPath, "utf-8")

    // Prepare keywords summary for prompt
    const keywordsSummary = keywords
      .map(
        (k) =>
          `"${k.keyword}" (Volume: ${k.searchVolume}, CPC: €${k.cpc.toFixed(2)}, Difficulty: ${k.difficulty}%, Intent: ${k.intent})`
      )
      .join("\n")

    // Create comprehensive prompt
    const prompt = `Tu es un expert en Google Ads avec 15 ans d'expérience. Tu vas créer une campagne Google Ads optimisée pour la page suivante.

**INFORMATIONS DE LA PAGE :**
- URL : ${pageUrl}
- Titre : ${pageTitle || "Non spécifié"}

**MOTS-CLÉS ANALYSÉS :**
${keywordsSummary}

**TYPE DE CAMPAGNE DEMANDÉ :** ${campaignType === "ai_recommended" ? "Tu choisis le meilleur type selon ton analyse" : campaignType}

**DOCUMENTATION GOOGLE ADS EDITOR À RESPECTER :**
${googleAdsEditorContent}

**TÂCHES À ACCOMPLIR :**

1. **ANALYSE ET RECOMMANDATION** (si ai_recommended) :
   - Analyse les mots-clés et détermine le meilleur type de campagne (search ou pmax)
   - Justifie ton choix

2. **PERSONAS CIBLES** :
   - Crée 2-3 personas détaillés (âge, genre, centres d'intérêt, comportement d'achat)
   - Base-toi sur l'analyse des mots-clés et leur intent

3. **CONTENU DE CAMPAGNE** :
   - Nom de campagne optimisé (format : [Pays]_[Type]_[Catégorie]_2025)
   - 8-12 headlines (max 30 caractères chacun) variés et accrocheurs
   - 3-4 descriptions (max 90 caractères chacune) complémentaires
   - URL de destination finale

4. **PARAMÈTRES RECOMMANDÉS** :
   - Budget quotidien suggéré (€)
   - Zones géographiques cibles
   - Langues cibles
   - Stratégie d'enchères
   - CPA/ROAS cibles si applicable

**RÉPONDS EN JSON STRUCTURÉ UNIQUEMENT :**

{
  "recommended_type": "${campaignType === "ai_recommended" ? "search ou pmax avec justification" : campaignType}",
  "recommendation_reason": "Explication de ton choix si ai_recommended",
  "personas": [
    {
      "name": "Nom du persona",
      "age_range": "25-35",
      "gender": "Mixte/Homme/Femme",
      "interests": ["intérêt1", "intérêt2"],
      "behavior": "Description du comportement d'achat",
      "pain_points": ["problème1", "problème2"]
    }
  ],
  "campaign_name": "FR_Search_Category_2025",
  "headlines": [
    "Titre 1 accrocheur",
    "Titre 2 avec bénéfice",
    "etc..."
  ],
  "descriptions": [
    "Description détaillée 1 avec call-to-action",
    "Description 2 avec valeur ajoutée",
    "etc..."
  ],
  "settings": {
    "daily_budget": 45.00,
    "target_locations": ["France", "Canada"],
    "target_languages": ["French"],
    "bid_strategy": "Maximize conversions",
    "target_cpa": 25.00,
    "target_roas": null
  }
}

**IMPORTANT :** Assure-toi que les headlines respectent 30 caractères max et les descriptions 90 caractères max. Sois créatif et optimise pour la conversion.`

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Tu es un expert en Google Ads spécialisé dans la création de campagnes performantes. Tu réponds toujours en JSON valide.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const rawResponse = completion.choices[0]?.message?.content
    if (!rawResponse) {
      throw new Error("No response from OpenAI")
    }

    // Parse AI response
    let aiResponse
    try {
      aiResponse = JSON.parse(rawResponse)
    } catch (parseError) {
      console.error("Failed to parse AI response:", rawResponse)
      throw new Error("Invalid JSON response from AI")
    }

    // Determine final campaign type
    const finalCampaignType =
      campaignType === "ai_recommended"
        ? aiResponse.recommended_type.includes("pmax")
          ? "pmax"
          : "search"
        : campaignType

    // Calculate OpenAI cost (approximate)
    const inputTokens = Math.ceil(prompt.length / 4)
    const outputTokens = completion.usage?.completion_tokens || 500
    const cost = inputTokens * 0.00003 + outputTokens * 0.00006 // GPT-4 pricing

    // Debug: Log data before inserting
    console.log("Attempting to save campaign with data:")
    console.log("- user_id:", user.id)
    console.log("- website_id:", resolvedWebsiteId)
    console.log("- headlines count:", aiResponse.headlines?.length)
    console.log("- descriptions count:", aiResponse.descriptions?.length)
    console.log("- personas:", JSON.stringify(aiResponse.personas, null, 2))

    // Save to database
    const { data: campaign, error: dbError } = await supabase
      .from("google_ads_campaigns")
      .insert({
        user_id: user.id,
        website_id: resolvedWebsiteId,
        page_url: pageUrl,
        page_title: pageTitle,
        keywords: keywords,
        campaign_type: campaignType,
        recommended_type: finalCampaignType,
        personas: aiResponse.personas,
        campaign_name: aiResponse.campaign_name,
        headlines: aiResponse.headlines,
        descriptions: aiResponse.descriptions,
        budget_recommendation: aiResponse.settings?.daily_budget,
        target_locations: aiResponse.settings?.target_locations,
        target_languages: aiResponse.settings?.target_languages,
        bid_strategy: aiResponse.settings?.bid_strategy,
        target_cpa: aiResponse.settings?.target_cpa,
        target_roas: aiResponse.settings?.target_roas,
        openai_model: "gpt-4",
        openai_tokens_used: completion.usage?.total_tokens || 0,
        openai_cost: cost,
        raw_ai_response: aiResponse,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error details:", JSON.stringify(dbError, null, 2))
      console.error("Database error message:", dbError.message)
      console.error("Database error code:", dbError.code)
      throw new Error(
        `Failed to save campaign: ${dbError.message || JSON.stringify(dbError)}`
      )
    }

    return NextResponse.json({
      success: true,
      campaign: campaign,
      message: "Campaign generated successfully",
    })
  } catch (error) {
    console.error("Campaign generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
