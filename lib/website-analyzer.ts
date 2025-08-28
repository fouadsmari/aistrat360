import { DataForSEOClient } from "./dataforseo-client"
import { OpenAIClient } from "./openai-client"
import { CacheManager } from "./cache-manager"

export interface WebsiteInsights {
  domain: string
  detectedLanguage: string
  targetCountry: string
  currency: string // CAD, USD, EUR, etc.
  currencySymbol: string // $, €, £, etc.
  industry: string
  businessType: "b2b" | "b2c" | "local" | "mixed"
  suggestedKeywords: string[]
  websiteQuality: number // 0-100 score
  competitiveness: "low" | "medium" | "high"
  businessModel: string
  targetAudience: string
}

export class WebsiteAnalyzer {
  private dataForSEO: DataForSEOClient
  private openAI: OpenAIClient
  private cache: CacheManager

  constructor() {
    this.dataForSEO = new DataForSEOClient()
    this.openAI = new OpenAIClient()
    this.cache = new CacheManager()
  }

  /**
   * Analyze a website and extract business insights
   */
  async analyzeWebsite(websiteUrl: string): Promise<WebsiteInsights> {
    try {
      console.log(`🔍 WebsiteAnalyzer: Starting analysis for ${websiteUrl}`)

      // Extract domain from URL
      const url = new URL(websiteUrl)
      const domain = url.hostname.replace("www.", "")
      console.log(`🌐 WebsiteAnalyzer: Extracted domain: ${domain}`)

      // Check cache first
      console.log(`🔍 WebsiteAnalyzer: Checking cache for ${websiteUrl}`)
      const cached = await this.cache.getCachedResponse(
        { url: websiteUrl },
        "website_analyzer",
        "full_analysis"
      )
      if (cached) {
        console.log(`✅ WebsiteAnalyzer: Cache HIT - returning cached analysis`)
        return cached
      }
      console.log(
        `❌ WebsiteAnalyzer: Cache MISS - proceeding with fresh analysis`
      )

      // Step 1: Get website content from page
      console.log(`📄 WebsiteAnalyzer: Step 1 - Fetching website content...`)
      const websiteContent = await this.fetchWebsiteContent(websiteUrl)
      console.log(
        `✅ WebsiteAnalyzer: Step 1 complete - Got ${websiteContent.length} chars of content`
      )

      // Step 2: Get keywords suggestions from DataForSEO
      console.log(
        `🔍 WebsiteAnalyzer: Step 2 - Getting keyword suggestions for ${domain}...`
      )
      const suggestedKeywords = await this.dataForSEO.getKeywordsForSite(domain)
      console.log(
        `✅ WebsiteAnalyzer: Step 2 complete - Got ${suggestedKeywords.length} keyword suggestions`
      )

      // Step 3: Analyze with AI
      console.log(`🤖 WebsiteAnalyzer: Step 3 - Analyzing with AI...`)
      const aiAnalysis = await this.analyzeWithAI({
        url: websiteUrl,
        domain,
        content: websiteContent,
        existingKeywords: suggestedKeywords.slice(0, 10),
      })
      console.log(
        `✅ WebsiteAnalyzer: Step 3 complete - AI analysis done for industry: ${aiAnalysis.industry}`
      )

      // Step 4: Combine all insights
      console.log(`📊 WebsiteAnalyzer: Step 4 - Combining insights...`)
      const targetCountry = this.detectCountry(domain, websiteContent)
      const detectedLanguage = this.detectLanguage(websiteContent, domain)
      console.log(
        `🌍 WebsiteAnalyzer: Detected country: ${targetCountry}, language: ${detectedLanguage}`
      )

      const insights: WebsiteInsights = {
        domain,
        detectedLanguage,
        targetCountry,
        currency: this.getCurrency(targetCountry),
        currencySymbol: this.getCurrencySymbol(targetCountry),
        industry: aiAnalysis.industry,
        businessType: aiAnalysis.businessType,
        suggestedKeywords: [
          ...new Set([
            ...suggestedKeywords.slice(0, 15),
            ...(aiAnalysis.keywords || []).slice(0, 15),
          ]),
        ].slice(0, 30),
        websiteQuality: this.calculateQualityScore(websiteContent),
        competitiveness: aiAnalysis.competitiveness,
        businessModel: aiAnalysis.businessModel,
        targetAudience: aiAnalysis.targetAudience,
      }
      console.log(
        `✅ WebsiteAnalyzer: Step 4 complete - Final insights prepared`
      )
      console.log(
        `📋 WebsiteAnalyzer: Summary - ${insights.suggestedKeywords.length} keywords, ${insights.currency} currency, ${insights.industry} industry`
      )

      // Cache the results for 90 days
      console.log(`💾 WebsiteAnalyzer: Step 5 - Caching results for 90 days...`)
      await this.cache.setCachedResponse(
        { url: websiteUrl },
        "website_analyzer",
        "full_analysis",
        insights
      )
      console.log(`✅ WebsiteAnalyzer: Step 5 complete - Results cached`)

      console.log(`🎉 WebsiteAnalyzer: ANALYSIS COMPLETE for ${domain}`)
      return insights
    } catch (error) {
      console.error(
        `❌ WebsiteAnalyzer: ANALYSIS FAILED for ${websiteUrl}:`,
        error
      )
      console.error(`❌ WebsiteAnalyzer: Error details:`, {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "No message",
      })

      // Return basic insights on error
      console.log(
        `🔄 WebsiteAnalyzer: Returning fallback insights for ${websiteUrl}`
      )
      const url = new URL(websiteUrl)
      const domain = url.hostname.replace("www.", "")
      const fallbackCountry = this.detectCountry(domain, "")

      const fallbackInsights: WebsiteInsights = {
        domain,
        detectedLanguage: this.detectLanguage("", domain),
        targetCountry: fallbackCountry,
        currency: this.getCurrency(fallbackCountry),
        currencySymbol: this.getCurrencySymbol(fallbackCountry),
        industry: "general",
        businessType: "b2c" as const,
        suggestedKeywords: [],
        websiteQuality: 50,
        competitiveness: "medium" as const,
        businessModel: "service",
        targetAudience: "general",
      }

      console.log(
        `✅ WebsiteAnalyzer: Fallback insights prepared for ${domain}`
      )
      return fallbackInsights
    }
  }

  /**
   * Fetch website content
   */
  private async fetchWebsiteContent(url: string): Promise<string> {
    try {
      console.log(`🌐 fetchWebsiteContent: Starting fetch for ${url}`)

      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log(`⏰ fetchWebsiteContent: Timeout reached for ${url}`)
        controller.abort()
      }, 10000) // 10 second timeout

      console.log(`📡 fetchWebsiteContent: Making HTTP request to ${url}...`)
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; GoogleAdsAnalyzer/1.0)",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log(
        `✅ fetchWebsiteContent: HTTP response received - Status: ${response.status}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status}`)
      }

      console.log(`📄 fetchWebsiteContent: Reading response text...`)
      const html = await response.text()
      console.log(
        `📝 fetchWebsiteContent: Got ${html.length} characters of HTML`
      )

      // Extract text content from HTML (basic extraction)
      console.log(
        `🔧 fetchWebsiteContent: Extracting text content from HTML...`
      )
      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 5000) // Limit to 5000 chars

      console.log(
        `✅ fetchWebsiteContent: Text extraction complete - ${textContent.length} chars extracted`
      )
      return textContent
    } catch (error) {
      console.error(`❌ fetchWebsiteContent: Failed to fetch ${url}:`, error)
      console.error(`❌ fetchWebsiteContent: Error details:`, {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "No message",
      })

      // Return fallback content based on domain
      const domain = new URL(url).hostname.replace("www.", "")
      const fallbackContent = `Site web: ${domain}. Service professionnel en ligne.`
      console.log(
        `🔄 fetchWebsiteContent: Returning fallback content: "${fallbackContent}"`
      )
      return fallbackContent
    }
  }

  /**
   * Analyze content with AI
   */
  private async analyzeWithAI(data: {
    url: string
    domain: string
    content: string
    existingKeywords: string[]
  }): Promise<any> {
    const prompt = `
    Analyse ce site web et détermine précisément les informations business.
    
    URL: ${data.url}
    Domaine: ${data.domain}
    Mots-clés existants: ${data.existingKeywords.join(", ")}
    Contenu (extrait): ${data.content.substring(0, 2000)}
    
    Retourne un JSON structuré avec:
    {
      "industry": "secteur précis (ex: coaching-business, restaurant-italien, ecommerce-mode)",
      "businessType": "b2b|b2c|local|mixed",
      "keywords": ["15-20 mots-clés commerciaux pertinents pour Google Ads"],
      "targetAudience": "description précise de la cible",
      "competitiveness": "low|medium|high",
      "businessModel": "service|product|marketplace|saas|content|hybrid"
    }
    
    RÈGLES IMPORTANTES:
    - Mots-clés COMMERCIAUX avec intention d'achat
    - Focus sur des mots-clés spécifiques au business
    - Éviter les mots-clés trop génériques
    - Répondre UNIQUEMENT avec le JSON, sans texte supplémentaire
    `

    const aiResponse = await this.openAI.generateJSON(prompt)
    return aiResponse
  }

  /**
   * Detect website language
   */
  private detectLanguage(content: string, domain: string): string {
    // Check domain TLD
    if (domain.endsWith(".fr") || domain.endsWith(".be")) return "fr"
    if (domain.endsWith(".uk") || domain.endsWith(".com")) return "en"
    if (domain.endsWith(".de")) return "de"
    if (domain.endsWith(".es")) return "es"
    if (domain.endsWith(".it")) return "it"

    // Check content for French indicators
    const frenchIndicators = [
      "nous",
      "vous",
      "avec",
      "pour",
      "dans",
      "sur",
      "est",
      "sont",
      "être",
      "avoir",
      "faire",
      "dire",
      "aller",
      "voir",
      "savoir",
    ]

    const contentLower = content.toLowerCase()
    let frenchCount = 0

    for (const word of frenchIndicators) {
      if (contentLower.includes(` ${word} `)) {
        frenchCount++
      }
    }

    return frenchCount > 5 ? "fr" : "en"
  }

  /**
   * Detect target country
   */
  private detectCountry(domain: string, content: string): string {
    // Map domain TLD to country
    const tldMapping: Record<string, string> = {
      ".fr": "FR",
      ".be": "BE",
      ".ch": "CH",
      ".ca": "CA",
      ".uk": "GB",
      ".de": "DE",
      ".es": "ES",
      ".it": "IT",
      ".nl": "NL",
      ".com": "US",
      ".us": "US",
    }

    for (const [tld, country] of Object.entries(tldMapping)) {
      if (domain.endsWith(tld)) {
        return country
      }
    }

    // Check for country mentions in content
    if (content.includes("Canada") || content.includes("canadien")) return "CA"
    if (content.includes("France") || content.includes("français")) return "FR"
    if (content.includes("Belgium") || content.includes("Belgique")) return "BE"
    if (content.includes("United States") || content.includes("USA"))
      return "US"

    // Default based on language detection
    const contentLower = content.toLowerCase()
    if (contentLower.includes("dollar") && contentLower.includes("cad"))
      return "CA"
    if (contentLower.includes("dollar") && contentLower.includes("usd"))
      return "US"
    if (contentLower.includes("euro") || contentLower.includes("€")) return "FR"

    // Default to France for French market
    return "FR"
  }

  /**
   * Get currency symbol based on country
   */
  getCurrency(country: string): string {
    const currencyMapping: Record<string, string> = {
      CA: "CAD",
      US: "USD",
      FR: "EUR",
      BE: "EUR",
      CH: "CHF",
      GB: "GBP",
      DE: "EUR",
      ES: "EUR",
      IT: "EUR",
      NL: "EUR",
    }

    return currencyMapping[country] || "EUR"
  }

  /**
   * Get currency symbol for display
   */
  getCurrencySymbol(country: string): string {
    const symbolMapping: Record<string, string> = {
      CA: "$",
      US: "$",
      FR: "€",
      BE: "€",
      CH: "CHF",
      GB: "£",
      DE: "€",
      ES: "€",
      IT: "€",
      NL: "€",
    }

    return symbolMapping[country] || "€"
  }

  /**
   * Calculate website quality score
   */
  private calculateQualityScore(content: string): number {
    let score = 50 // Base score

    // Check content length
    if (content.length > 1000) score += 10
    if (content.length > 2000) score += 10

    // Check for business indicators
    const businessIndicators = [
      "contact",
      "service",
      "produit",
      "product",
      "prix",
      "price",
      "devis",
      "quote",
      "client",
      "customer",
      "solution",
    ]

    const contentLower = content.toLowerCase()
    for (const indicator of businessIndicators) {
      if (contentLower.includes(indicator)) {
        score += 3
      }
    }

    // Cap at 100
    return Math.min(score, 100)
  }
}
