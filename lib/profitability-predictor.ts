import { WebsiteAnalyzer, WebsiteInsights } from "./website-analyzer"
import { DataForSEOClient } from "./dataforseo-client"
import { OpenAIClient } from "./openai-client"
import { createSupabaseServerClient } from "./supabase-server"

export interface ProfitabilityInput {
  websiteUrl: string
  budget: number
  objective: "leads" | "sales" | "traffic" | "awareness"
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
    this.websiteAnalyzer = new WebsiteAnalyzer()
    this.dataForSEO = new DataForSEOClient()
    this.openAI = new OpenAIClient()
  }

  /**
   * Main prediction function
   */
  async predictProfitability(
    input: ProfitabilityInput,
    analysisId: string,
    onProgress?: (progress: number, status: string) => Promise<void>
  ): Promise<ProfitabilityPrediction> {
    try {
      console.log(
        `🚀 [${analysisId}] Starting profitability prediction for ${input.websiteUrl}`
      )

      // Step 1: Analyze website (10-30%)
      console.log(`🌐 [${analysisId}] Step 1: Starting website analysis...`)
      await onProgress?.(10, "Analyse de votre site web en cours...")

      const websiteAnalysis = await this.websiteAnalyzer.analyzeWebsite(
        input.websiteUrl
      )
      console.log(
        `✅ [${analysisId}] Step 1 completed: Website analysis done for ${websiteAnalysis.domain}`
      )
      console.log(
        `📊 [${analysisId}] Detected: ${websiteAnalysis.detectedLanguage}, ${websiteAnalysis.targetCountry}, ${websiteAnalysis.currency}`
      )

      await onProgress?.(30, "Analyse du site terminée")

      // Step 2: Get keyword data (30-50%)
      console.log(`🔍 [${analysisId}] Step 2: Starting keyword research...`)
      await onProgress?.(35, "Recherche des mots-clés pertinents...")

      // Combine suggested keywords with user keywords
      let allKeywords = [...websiteAnalysis.suggestedKeywords]
      console.log(
        `📝 [${analysisId}] Website suggested ${websiteAnalysis.suggestedKeywords.length} keywords`
      )

      if (input.keywords) {
        const userKeywords = input.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
        allKeywords = [...new Set([...allKeywords, ...userKeywords])]
        console.log(
          `➕ [${analysisId}] Added ${userKeywords.length} user keywords. Total: ${allKeywords.length}`
        )
      }

      // Get keyword volumes and CPC data with proper geo-targeting
      console.log(
        `🔢 [${analysisId}] Fetching keyword data for ${Math.min(30, allKeywords.length)} keywords in ${websiteAnalysis.targetCountry}...`
      )
      const keywordData = await this.dataForSEO.getKeywordData(
        allKeywords.slice(0, 30), // Limit to 30 keywords
        websiteAnalysis.targetCountry,
        websiteAnalysis.detectedLanguage
      )
      console.log(
        `✅ [${analysisId}] Step 2 completed: Got data for ${keywordData.length} keywords`
      )
      await onProgress?.(50, "Données de mots-clés récupérées")

      // Step 3: Generate negative keywords (50-60%)
      console.log(`🚫 [${analysisId}] Step 3: Generating negative keywords...`)
      await onProgress?.(55, "Génération des exclusions intelligentes...")
      const negativeKeywords = await this.openAI.generateNegativeKeywords(
        allKeywords.slice(0, 15),
        websiteAnalysis.industry,
        websiteAnalysis.businessType
      )
      console.log(
        `✅ [${analysisId}] Step 3 completed: Generated ${negativeKeywords.length} negative keywords`
      )
      await onProgress?.(60, "Exclusions générées")

      // Step 4: Get traffic estimates (60-70%)
      console.log(`📈 [${analysisId}] Step 4: Getting traffic estimates...`)
      await onProgress?.(65, "Estimation du trafic potentiel...")
      const trafficEstimates = await this.dataForSEO.getTrafficEstimates(
        allKeywords.slice(0, 20),
        input.budget / 500, // Estimate bid based on budget
        websiteAnalysis.targetCountry,
        websiteAnalysis.detectedLanguage
      )
      console.log(`✅ [${analysisId}] Step 4 completed: Traffic estimates done`)
      await onProgress?.(70, "Estimations de trafic calculées")

      // Step 5: Predict ROI (70-85%)
      console.log(`💰 [${analysisId}] Step 5: Predicting ROI...`)
      await onProgress?.(75, "Calcul de votre ROI prédit...")
      const roiPrediction = await this.openAI.predictROI({
        keywords: keywordData,
        budget: input.budget,
        industry: websiteAnalysis.industry,
        businessType: websiteAnalysis.businessType,
        objective: input.objective,
        competitiveness: websiteAnalysis.competitiveness,
      })
      console.log(
        `✅ [${analysisId}] Step 5 completed: ROI prediction done (${roiPrediction.roiPercentage}%)`
      )
      await onProgress?.(85, "Prédictions ROI terminées")

      // Step 6: Generate recommendations (85-95%)
      console.log(`💡 [${analysisId}] Step 6: Generating recommendations...`)
      await onProgress?.(90, "Génération des recommandations personnalisées...")
      const recommendations = this.generateRecommendations(
        websiteAnalysis,
        roiPrediction,
        input
      )
      console.log(
        `✅ [${analysisId}] Step 6 completed: ${recommendations.length} recommendations generated`
      )

      // Step 7: Calculate budget allocation
      console.log(`💸 [${analysisId}] Step 7: Calculating budget allocation...`)
      const budgetAllocation = this.calculateBudgetAllocation(
        websiteAnalysis,
        input.objective
      )
      console.log(`✅ [${analysisId}] Step 7 completed: Budget allocation done`)

      // Step 8: Create monthly projections
      console.log(`📅 [${analysisId}] Step 8: Creating monthly projections...`)
      const monthlyProjection = this.createMonthlyProjection(
        roiPrediction,
        input.budget
      )
      console.log(
        `✅ [${analysisId}] Step 8 completed: Monthly projections done`
      )

      // Step 9: Format recommended keywords
      console.log(
        `🔤 [${analysisId}] Step 9: Formatting recommended keywords...`
      )
      const recommendedKeywords = keywordData
        .filter(
          (kw) =>
            (kw.search_volume || 0) > 10 && (kw.cpc || 0) < input.budget * 0.05
        )
        .sort((a, b) => {
          // Sort by value score (volume / cpc)
          const scoreA = (a.search_volume || 0) / (a.cpc || 1)
          const scoreB = (b.search_volume || 0) / (b.cpc || 1)
          return scoreB - scoreA
        })
        .slice(0, 20)
        .map((kw) => ({
          keyword: kw.keyword,
          searchVolume: kw.search_volume || 0,
          cpc: kw.cpc || 0,
          difficulty: kw.competition || 0.5,
        }))
      console.log(
        `✅ [${analysisId}] Step 9 completed: ${recommendedKeywords.length} keywords formatted`
      )

      await onProgress?.(95, "Analyse complète terminée!")

      // Final result
      console.log(`📦 [${analysisId}] Step 10: Preparing final result...`)
      const prediction: ProfitabilityPrediction = {
        websiteAnalysis,
        roiPrediction,
        recommendedKeywords,
        negativeKeywords: negativeKeywords.slice(0, 50),
        budgetAllocation,
        monthlyProjection,
        recommendations,
      }

      // Save to database
      console.log(`💾 [${analysisId}] Step 11: Saving to database...`)
      await this.savePrediction(analysisId, prediction)
      console.log(
        `✅ [${analysisId}] Step 11 completed: Results saved to database`
      )

      await onProgress?.(100, "Résultats sauvegardés")
      console.log(
        `🎉 [${analysisId}] ANALYSIS COMPLETE! All steps finished successfully`
      )

      return prediction
    } catch (error) {
      console.error(`❌ [${analysisId}] ANALYSIS FAILED:`, error)
      console.error(`❌ [${analysisId}] Error details:`, {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "No message",
        stack:
          error instanceof Error
            ? error.stack?.split("\n").slice(0, 3)
            : "No stack",
      })
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
    try {
      const supabase = await createSupabaseServerClient()

      await supabase
        .from("profitability_analyses")
        .update({
          result_data: prediction,
          status: "completed",
          progress: 100,
          completed_at: new Date().toISOString(),
        })
        .eq("id", analysisId)
    } catch (error) {
      // Error saving prediction - continue silently
    }
  }
}
