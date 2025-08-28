import { WebsiteAnalyzer, WebsiteInsights } from "./website-analyzer"
import { DataForSEOClient } from "./dataforseo-client"
import { OpenAIClient } from "./openai-client"
import { createSupabaseServerClient } from "./supabase-server"

export interface ProfitabilityInput {
  websiteUrl: string
  budget: number
  objective: "leads" | "sales" | "traffic" | "awareness"
  targetCountry:
    | "CA"
    | "US"
    | "FR"
    | "BE"
    | "CH"
    | "GB"
    | "DE"
    | "ES"
    | "IT"
    | "NL"
  keywords?: string
}

export interface ProfitabilityPrediction {
  websiteAnalysis: WebsiteInsights
  roiPrediction: {
    estimatedClicks: number
    estimatedCost: number
    estimatedLeads: number
    estimatedConversions: number
    roiPercentage: number
    breakEvenDays: number
    confidence: "low" | "medium" | "high"
  }
  recommendedKeywords: Array<{
    keyword: string
    searchVolume: number
    cpc: number
    difficulty: number
  }>
  negativeKeywords: string[]
  budgetAllocation: {
    keywords: number // % for keywords
    remarketing: number // % for remarketing
    display: number // % for display
    reserve: number // % to keep as reserve
  }
  monthlyProjection: {
    month1: { clicks: number; cost: number; leads: number }
    month2: { clicks: number; cost: number; leads: number }
    month3: { clicks: number; cost: number; leads: number }
  }
  recommendations: string[]
}

export class ProfitabilityPredictor {
  private websiteAnalyzer: WebsiteAnalyzer
  private dataForSEO: DataForSEOClient
  private openAI: OpenAIClient

  constructor() {
    console.log(`🔷 [PREDICTOR] Constructor called at ${new Date().toISOString()}`)
    console.log(`🔷 [PREDICTOR] Creating WebsiteAnalyzer...`)
    this.websiteAnalyzer = new WebsiteAnalyzer()
    console.log(`✅ [PREDICTOR] WebsiteAnalyzer created`)
    
    console.log(`🔷 [PREDICTOR] Creating DataForSEOClient...`)
    this.dataForSEO = new DataForSEOClient()
    console.log(`✅ [PREDICTOR] DataForSEOClient created`)
    
    console.log(`🔷 [PREDICTOR] Creating OpenAIClient...`)
    this.openAI = new OpenAIClient()
    console.log(`✅ [PREDICTOR] OpenAIClient created`)
    
    console.log(`✅ [PREDICTOR] Constructor completed`)
  }

  /**
   * NEW 4-STEP SIMPLIFIED WORKFLOW
   */
  async predictProfitability(
    input: ProfitabilityInput,
    analysisId: string,
    onProgress?: (progress: number, status: string) => Promise<void>
  ): Promise<ProfitabilityPrediction> {
    console.log(`\n${'*'.repeat(80)}`)
    console.log(`🔷 [PREDICTOR] predictProfitability() called at ${new Date().toISOString()}`)
    console.log(`🔷 [PREDICTOR] Analysis ID: ${analysisId}`)
    console.log(`🔷 [PREDICTOR] Full input:`, JSON.stringify(input, null, 2))
    console.log(`🔷 [PREDICTOR] Has onProgress callback: ${!!onProgress}`)
    console.log(`${'*'.repeat(80)}\n`)
    
    try {
      console.log(
        `🚀 [${analysisId}] Starting NEW simplified workflow for ${input.websiteUrl}`
      )

      // STEP 1: DataForSEO fetches HTML content (0-25%)
      console.log(`\n${'='.repeat(60)}`)
      console.log(`🌐 [${analysisId}] STEP 1: Fetching website HTML...`)
      console.log(`${'='.repeat(60)}`)
      console.log(
        `🔧 [${analysisId}] STEP 1: About to call this.dataForSEO.getWebsiteHTML(${input.websiteUrl})`
      )
      console.log(`🔧 [${analysisId}] STEP 1: Calling onProgress(10)...`)
      await onProgress?.(10, "Récupération du contenu du site...")
      console.log(`✅ [${analysisId}] STEP 1: onProgress(10) completed`)

      let htmlContent: string
      try {
        console.log(`🔧 [${analysisId}] STEP 1: Entering dataForSEO.getWebsiteHTML()...`)
        const startTime = Date.now()
        htmlContent = await this.dataForSEO.getWebsiteHTML(input.websiteUrl)
        const duration = Date.now() - startTime
        
        console.log(
          `✅ [${analysisId}] STEP 1 completed in ${duration}ms: Got ${htmlContent.length} chars`
        )
        console.log(
          `🔧 [${analysisId}] STEP 1: HTML preview: "${htmlContent.substring(0, 200)}..."`
        )
        console.log(`🔧 [${analysisId}] STEP 1: Calling onProgress(25)...`)
        await onProgress?.(25, "Contenu récupéré avec succès")
        console.log(`✅ [${analysisId}] STEP 1: onProgress(25) completed`)
      } catch (error) {
        console.error(
          `❌ [${analysisId}] STEP 1 failed: DataForSEO HTML fetch error:`,
          error
        )
        throw new Error(
          `STEP 1 failed: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      }

      // STEP 2: OpenAI extracts exactly 3 targeted keywords (25-50%)
      console.log(`\n${'='.repeat(60)}`)
      console.log(
        `🤖 [${analysisId}] STEP 2: AI extracting 3 targeted keywords...`
      )
      console.log(`${'='.repeat(60)}`)
      console.log(
        `🔧 [${analysisId}] STEP 2: About to call this.openAI.extractTargetedKeywords`
      )
      console.log(
        `🔧 [${analysisId}] STEP 2: Parameters: URL=${input.websiteUrl}, Country=${input.targetCountry}, Objective=${input.objective}`
      )
      console.log(`🔧 [${analysisId}] STEP 2: Calling onProgress(35)...`)
      await onProgress?.(
        35,
        `Analyse IA pour le marché ${input.targetCountry}...`
      )
      console.log(`✅ [${analysisId}] STEP 2: onProgress(35) completed`)

      let targetedKeywords: string[]
      try {
        console.log(`🔧 [${analysisId}] STEP 2: Entering openAI.extractTargetedKeywords()...`)
        const startTime = Date.now()
        targetedKeywords = await this.openAI.extractTargetedKeywords(
          htmlContent,
          input.websiteUrl,
          input.targetCountry,
          input.objective
        )
        const duration = Date.now() - startTime
        
        console.log(
          `✅ [${analysisId}] STEP 2 completed in ${duration}ms: Got 3 keywords: ${targetedKeywords.join(", ")}`
        )
        console.log(
          `🔧 [${analysisId}] STEP 2: Keywords validation: length=${targetedKeywords.length}`
        )
        console.log(`🔧 [${analysisId}] STEP 2: Calling onProgress(50)...`)
        await onProgress?.(50, "3 mots-clés ultra-pertinents identifiés")
        console.log(`✅ [${analysisId}] STEP 2: onProgress(50) completed`)
      } catch (error) {
        console.error(
          `❌ [${analysisId}] STEP 2 failed: OpenAI keyword extraction error:`,
          error
        )
        throw new Error(
          `STEP 2 failed: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      }

      // STEP 3: DataForSEO gets comprehensive data for these 3 keywords (50-75%)
      console.log(`\n${'='.repeat(60)}`)
      console.log(
        `🔢 [${analysisId}] STEP 3: Getting keyword data for targeted keywords...`
      )
      console.log(`${'='.repeat(60)}`)
      console.log(
        `🔧 [${analysisId}] STEP 3: About to call this.dataForSEO.getKeywordData`
      )
      console.log(
        `🔧 [${analysisId}] STEP 3: Parameters: keywords=${JSON.stringify(targetedKeywords)}, country=${input.targetCountry}, lang=fr`
      )
      console.log(`🔧 [${analysisId}] STEP 3: Calling onProgress(60)...`)
      await onProgress?.(60, "Récupération données de marché...")
      console.log(`✅ [${analysisId}] STEP 3: onProgress(60) completed`)

      let keywordData: any[]
      try {
        console.log(`🔧 [${analysisId}] STEP 3: Entering dataForSEO.getKeywordData()...`)
        const startTime = Date.now()
        keywordData = await this.dataForSEO.getKeywordData(
          targetedKeywords,
          input.targetCountry,
          "fr" // Default to French for now, can be improved later
        )
        const duration = Date.now() - startTime
        
        console.log(
          `✅ [${analysisId}] STEP 3 completed in ${duration}ms: Got market data for ${keywordData.length} keywords`
        )
        console.log(
          `🔧 [${analysisId}] STEP 3: Keyword data sample:`,
          keywordData.length > 0
            ? {
                firstKeyword: keywordData[0].keyword,
                hasVolume: !!keywordData[0].search_volume,
                hasCpc: !!keywordData[0].cpc,
                volumes: keywordData.map((k) => k.search_volume),
                cpcs: keywordData.map((k) => k.cpc),
              }
            : "No data"
        )
        console.log(`🔧 [${analysisId}] STEP 3: Calling onProgress(75)...`)
        await onProgress?.(75, "Données de marché récupérées")
        console.log(`✅ [${analysisId}] STEP 3: onProgress(75) completed`)
      } catch (error) {
        console.error(
          `❌ [${analysisId}] STEP 3 failed: DataForSEO keyword data error:`,
          error
        )
        throw new Error(
          `STEP 3 failed: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      }

      // STEP 4: Generate final analysis and recommendations (75-100%)
      console.log(`\n${'='.repeat(60)}`)
      console.log(`💡 [${analysisId}] STEP 4: Generating final analysis...`)
      console.log(`${'='.repeat(60)}`)
      console.log(
        `🔧 [${analysisId}] STEP 4: Creating website analysis object...`
      )
      console.log(`🔧 [${analysisId}] STEP 4: Calling onProgress(85)...`)
      await onProgress?.(85, "Génération analyse finale...")
      console.log(`✅ [${analysisId}] STEP 4: onProgress(85) completed`)

      // Create basic website analysis from HTML
      const url = new URL(input.websiteUrl)
      const domain = url.hostname.replace("www.", "")
      console.log(`🔧 [${analysisId}] STEP 4: Extracted domain: ${domain}`)
      console.log(
        `🔧 [${analysisId}] STEP 4: Target country: ${input.targetCountry}`
      )

      const websiteAnalysis: WebsiteInsights = {
        domain,
        detectedLanguage:
          input.targetCountry === "US" || input.targetCountry === "GB"
            ? "en"
            : "fr",
        targetCountry: input.targetCountry,
        currency: this.websiteAnalyzer.getCurrency(input.targetCountry),
        currencySymbol: this.websiteAnalyzer.getCurrencySymbol(
          input.targetCountry
        ),
        industry: "business", // Simplified for now
        businessType: "b2c", // Default
        suggestedKeywords: targetedKeywords,
        websiteQuality: 75, // Default good score
        competitiveness: "medium",
        businessModel: "service",
        targetAudience: "clients potentiels",
      }
      console.log(`🔧 [${analysisId}] STEP 4: Website analysis created:`, {
        domain: websiteAnalysis.domain,
        currency: websiteAnalysis.currency,
        currencySymbol: websiteAnalysis.currencySymbol,
        keywordCount: websiteAnalysis.suggestedKeywords.length,
      })

      // Generate basic ROI prediction
      console.log(`🔧 [${analysisId}] STEP 4: Calculating ROI predictions...`)
      const avgCpc =
        keywordData.reduce((sum, kw) => sum + (kw.cpc || 1), 0) /
        keywordData.length
      const totalVolume = keywordData.reduce(
        (sum, kw) => sum + (kw.search_volume || 0),
        0
      )
      const estimatedClicks = Math.floor(input.budget / avgCpc)
      const estimatedLeads = Math.floor(estimatedClicks * 0.02) // 2% conversion rate
      const estimatedConversions = Math.floor(estimatedLeads * 0.15) // 15% close rate
      const roiPercentage = Math.floor(
        ((estimatedConversions * 500 - input.budget) / input.budget) * 100
      )

      console.log(`🔧 [${analysisId}] STEP 4: ROI calculations:`, {
        avgCpc,
        totalVolume,
        estimatedClicks,
        estimatedLeads,
        estimatedConversions,
        roiPercentage,
      })

      const roiPrediction = {
        estimatedClicks,
        estimatedCost: input.budget,
        estimatedLeads,
        estimatedConversions,
        roiPercentage: Math.max(50, roiPercentage), // Minimum 50% ROI
        breakEvenDays:
          Math.floor((input.budget / (estimatedConversions * 10)) * 30) || 90,
        confidence: "medium" as const,
      }

      // Format recommended keywords
      const recommendedKeywords = keywordData.map((kw) => ({
        keyword: kw.keyword,
        searchVolume: kw.search_volume || 0,
        cpc: kw.cpc || 0,
        difficulty: kw.competition || 0.5,
      }))

      // Generate simple recommendations
      const recommendations = [
        `✅ Ciblage précis: Les 3 mots-clés identifiés sont parfaits pour ${input.targetCountry}`,
        `💰 Budget optimisé: Votre budget de ${input.budget}€ permet d'obtenir ~${estimatedClicks} clics/mois`,
        `🎯 ROI prédit: ${roiPercentage}% de retour sur investissement estimé`,
        `📈 Potentiel: ${totalVolume} recherches mensuelles totales sur vos mots-clés`,
      ]

      // Create final prediction
      const prediction: ProfitabilityPrediction = {
        websiteAnalysis,
        roiPrediction,
        recommendedKeywords,
        negativeKeywords: [], // Simplified: no negative keywords for now
        budgetAllocation: {
          keywords: 80,
          remarketing: 15,
          display: 5,
          reserve: 0,
        },
        monthlyProjection: {
          month1: {
            clicks: Math.floor(estimatedClicks * 0.7),
            cost: input.budget,
            leads: Math.floor(estimatedLeads * 0.6),
          },
          month2: {
            clicks: Math.floor(estimatedClicks * 0.9),
            cost: input.budget,
            leads: Math.floor(estimatedLeads * 0.8),
          },
          month3: {
            clicks: estimatedClicks,
            cost: input.budget,
            leads: estimatedLeads,
          },
        },
        recommendations,
      }

      console.log(`✅ [${analysisId}] STEP 4 completed: Final analysis ready`)

      // Save to database
      console.log(`🔧 [${analysisId}] Calling onProgress(95)...`)
      await onProgress?.(95, "Sauvegarde en cours...")
      console.log(`✅ [${analysisId}] onProgress(95) completed`)
      
      console.log(`🔧 [${analysisId}] Calling savePrediction()...`)
      const saveStart = Date.now()
      await this.savePrediction(analysisId, prediction)
      console.log(`✅ [${analysisId}] savePrediction() completed in ${Date.now() - saveStart}ms`)

      console.log(`🔧 [${analysisId}] Calling onProgress(100)...`)
      await onProgress?.(100, "Analyse terminée!")
      console.log(`✅ [${analysisId}] onProgress(100) completed`)
      
      console.log(`🎉 [${analysisId}] NEW WORKFLOW COMPLETE!`)
      console.log(`${'*'.repeat(80)}\n`)

      return prediction
    } catch (error) {
      console.error(`❌ [${analysisId}] NEW WORKFLOW FAILED:`, error)
      console.error(`❌ [${analysisId}] Error details:`, {
        name: error?.constructor?.name,
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : 'No stack'
      })
      console.log(`${'*'.repeat(80)}\n`)
      throw error
    }
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    websiteAnalysis: WebsiteInsights,
    roiPrediction: any,
    input: ProfitabilityInput
  ): string[] {
    const recommendations: string[] = []

    // ROI-based recommendations
    if (roiPrediction.roiPercentage < 100) {
      recommendations.push(
        "⚠️ ROI prédit faible. Considérez d'augmenter votre budget ou de cibler des mots-clés moins compétitifs."
      )
    } else if (roiPrediction.roiPercentage > 200) {
      recommendations.push(
        "✅ Excellent ROI prédit! Votre marché semble peu compétitif avec un fort potentiel."
      )
    }

    // Budget recommendations
    if (input.budget < 500) {
      recommendations.push(
        "💡 Budget limité détecté. Focalisez sur 5-10 mots-clés très spécifiques pour maximiser l'impact."
      )
    } else if (input.budget > 3000) {
      recommendations.push(
        "💰 Budget confortable. Diversifiez avec du remarketing et YouTube Ads pour maximiser la portée."
      )
    }

    // Industry-specific recommendations
    if (websiteAnalysis.businessType === "b2b") {
      recommendations.push(
        "🎯 B2B détecté: Privilégiez LinkedIn Ads en complément pour toucher les décideurs."
      )
    } else if (websiteAnalysis.businessType === "local") {
      recommendations.push(
        "📍 Business local: Activez absolument les extensions de lieu et Google My Business."
      )
    }

    // Competition-based recommendations
    if (websiteAnalysis.competitiveness === "high") {
      recommendations.push(
        "🔥 Marché très compétitif. Stratégie long-tail recommandée avec mots-clés de 3-4 mots."
      )
    }

    // Objective-specific recommendations
    if (input.objective === "leads") {
      recommendations.push(
        "📧 Objectif Leads: Créez une landing page dédiée avec formulaire optimisé pour maximiser les conversions."
      )
    } else if (input.objective === "sales") {
      recommendations.push(
        "🛒 Objectif Ventes: Implémentez le tracking e-commerce et les campagnes Shopping si applicable."
      )
    }

    return recommendations
  }

  /**
   * Calculate budget allocation
   */
  private calculateBudgetAllocation(
    websiteAnalysis: WebsiteInsights,
    objective: string
  ): ProfitabilityPrediction["budgetAllocation"] {
    let allocation = {
      keywords: 70,
      remarketing: 15,
      display: 10,
      reserve: 5,
    }

    // Adjust based on business type
    if (websiteAnalysis.businessType === "b2b") {
      allocation = {
        keywords: 80,
        remarketing: 10,
        display: 5,
        reserve: 5,
      }
    } else if (websiteAnalysis.businessType === "local") {
      allocation = {
        keywords: 60,
        remarketing: 20,
        display: 15,
        reserve: 5,
      }
    }

    // Adjust based on objective
    if (objective === "awareness") {
      allocation.display += 10
      allocation.keywords -= 10
    } else if (objective === "sales") {
      allocation.remarketing += 10
      allocation.display -= 5
      allocation.reserve -= 5
    }

    return allocation
  }

  /**
   * Create monthly projections
   */
  private createMonthlyProjection(
    roiPrediction: any,
    budget: number
  ): ProfitabilityPrediction["monthlyProjection"] {
    // Month 1: Learning phase (70% efficiency)
    const month1 = {
      clicks: Math.floor(roiPrediction.estimatedClicks * 0.7),
      cost: Math.floor(budget * 0.9),
      leads: Math.floor(roiPrediction.estimatedLeads * 0.6),
    }

    // Month 2: Optimization phase (85% efficiency)
    const month2 = {
      clicks: Math.floor(roiPrediction.estimatedClicks * 0.85),
      cost: Math.floor(budget * 0.95),
      leads: Math.floor(roiPrediction.estimatedLeads * 0.8),
    }

    // Month 3: Optimized (100% efficiency)
    const month3 = {
      clicks: roiPrediction.estimatedClicks,
      cost: roiPrediction.estimatedCost,
      leads: roiPrediction.estimatedLeads,
    }

    return { month1, month2, month3 }
  }

  /**
   * Save prediction to database
   */
  private async savePrediction(
    analysisId: string,
    prediction: ProfitabilityPrediction
  ): Promise<void> {
    console.log(`🔷 [SAVE] savePrediction() called for ${analysisId}`)
    try {
      console.log(`🔷 [SAVE] Creating Supabase client...`)
      const supabase = await createSupabaseServerClient()
      console.log(`✅ [SAVE] Supabase client created`)

      console.log(`🔷 [SAVE] Updating analysis record in DB...`)
      const updateData = {
        result_data: prediction,
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
      }
      console.log(`🔷 [SAVE] Update data preview:`, {
        hasResultData: !!updateData.result_data,
        status: updateData.status,
        progress: updateData.progress,
        completedAt: updateData.completed_at
      })
      
      const { error } = await supabase
        .from("profitability_analyses")
        .update(updateData)
        .eq("id", analysisId)
      
      if (error) {
        console.error(`❌ [SAVE] Failed to save prediction:`, error)
      } else {
        console.log(`✅ [SAVE] Prediction saved successfully to DB`)
      }
    } catch (error) {
      console.error(`❌ [SAVE] Exception in savePrediction:`, error)
      // Error saving prediction - continue silently
    }
  }
}
