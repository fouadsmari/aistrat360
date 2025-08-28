import { CacheManager } from "./cache-manager"

export class OpenAIClient {
  private apiKey: string
  private cache: CacheManager

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY!
    this.cache = new CacheManager()
  }

  /**
   * Generate JSON response from OpenAI
   */
  async generateJSON(prompt: string, model: string = "gpt-4o-mini"): Promise<any> {
    // Check cache first
    const cacheKey = { prompt, model }
    const cached = await this.cache.getCachedResponse(
      cacheKey,
      "openai",
      "json_generation"
    )
    if (cached) {
      console.log("🎯 Cache HIT: OpenAI generation")
      return cached
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that responds ONLY with valid JSON. Never include any text outside the JSON structure.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3, // More deterministic
          max_tokens: 1000,
          response_format: { type: "json_object" },
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)

      // Cache the result
      await this.cache.setCachedResponse(
        cacheKey,
        "openai",
        "json_generation",
        result
      )

      return result
    } catch (error) {
      console.error("OpenAI API error:", error)
      // Return default structure on error
      return {
        industry: "general",
        businessType: "b2c",
        keywords: [],
        targetAudience: "general public",
        competitiveness: "medium",
        businessModel: "service",
      }
    }
  }

  /**
   * Generate negative keywords
   */
  async generateNegativeKeywords(
    mainKeywords: string[],
    industry: string,
    businessType: string = "b2b"
  ): Promise<string[]> {
    const inputData = {
      keywords: mainKeywords.sort(),
      industry,
      businessType,
    }

    // Check cache first
    const cached = await this.cache.getCachedResponse(
      inputData,
      "openai",
      "negative_keywords"
    )
    if (cached) {
      console.log("🎯 Cache HIT: Negative keywords")
      return cached
    }

    const prompt = `
    Génère 30 mots-clés négatifs pertinents pour Google Ads.
    
    Mots-clés principaux: ${mainKeywords.join(", ")}
    Secteur: ${industry}
    Type de business: ${businessType}
    
    Règles pour les mots-clés négatifs:
    - Éviter le trafic non-qualifié
    - Exclure les intentions gratuites si B2B
    - Exclure emploi/formation/tutoriel si c'est un service
    - Exclure DIY (faire soi-même) si c'est un service professionnel
    - Exclure les concurrents directs
    - Exclure les recherches d'information pure
    
    Retourne un JSON avec:
    {
      "negative_keywords": ["mot1", "mot2", "mot3", ...]
    }
    `

    const result = await this.generateJSON(prompt, "gpt-4o-mini")
    const negativeKeywords = result.negative_keywords || []

    // Cache the result
    await this.cache.setCachedResponse(
      inputData,
      "openai",
      "negative_keywords",
      negativeKeywords
    )

    return negativeKeywords
  }

  /**
   * Predict ROI based on data
   */
  async predictROI(data: {
    keywords: any[]
    budget: number
    industry: string
    businessType: string
    objective: string
    competitiveness: string
  }): Promise<{
    estimatedClicks: number
    estimatedCost: number
    estimatedLeads: number
    estimatedConversions: number
    roiPercentage: number
    breakEvenDays: number
    confidence: "low" | "medium" | "high"
  }> {
    const inputData = {
      budget: data.budget,
      industry: data.industry,
      businessType: data.businessType,
      objective: data.objective,
      competitiveness: data.competitiveness,
      keywordCount: data.keywords.length,
      avgCpc: data.keywords.reduce((sum, kw) => sum + (kw.cpc || 2), 0) / data.keywords.length,
      totalVolume: data.keywords.reduce((sum, kw) => sum + (kw.search_volume || 0), 0),
    }

    // Check cache first
    const cached = await this.cache.getCachedResponse(
      inputData,
      "openai",
      "roi_prediction"
    )
    if (cached) {
      console.log("🎯 Cache HIT: ROI prediction")
      return cached
    }

    const prompt = `
    Prédit le ROI pour cette campagne Google Ads.
    
    Budget mensuel: ${data.budget}€
    Industrie: ${data.industry}
    Type: ${data.businessType}
    Objectif: ${data.objective}
    Compétitivité: ${data.competitiveness}
    Nombre de mots-clés: ${data.keywords.length}
    CPC moyen: ${inputData.avgCpc}€
    Volume total: ${inputData.totalVolume} recherches/mois
    
    Basé sur les benchmarks de l'industrie, calcule:
    - Clics estimés par mois
    - Coût réel estimé
    - Leads estimés (selon taux de conversion moyen du secteur)
    - Conversions estimées
    - ROI en pourcentage
    - Temps pour rentabiliser (en jours)
    - Niveau de confiance de la prédiction
    
    Retourne un JSON avec:
    {
      "estimatedClicks": nombre,
      "estimatedCost": nombre,
      "estimatedLeads": nombre,
      "estimatedConversions": nombre,
      "roiPercentage": nombre,
      "breakEvenDays": nombre,
      "confidence": "low|medium|high"
    }
    
    Sois réaliste et conservateur dans tes estimations.
    `

    const result = await this.generateJSON(prompt, "gpt-4o-mini")
    
    const prediction = {
      estimatedClicks: result.estimatedClicks || Math.floor(data.budget / inputData.avgCpc),
      estimatedCost: result.estimatedCost || data.budget * 0.9,
      estimatedLeads: result.estimatedLeads || Math.floor(result.estimatedClicks * 0.02),
      estimatedConversions: result.estimatedConversions || Math.floor(result.estimatedLeads * 0.2),
      roiPercentage: result.roiPercentage || 150,
      breakEvenDays: result.breakEvenDays || 90,
      confidence: result.confidence || "medium",
    }

    // Cache the result
    await this.cache.setCachedResponse(
      inputData,
      "openai",
      "roi_prediction",
      prediction
    )

    return prediction
  }
}