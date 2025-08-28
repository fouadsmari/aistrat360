import { DataForSEOClient } from "./dataforseo-client"
import { OpenAIClient } from "./openai-client"
import { CacheManager } from "./cache-manager"

export interface WebsiteInsights {
  domain: string
  detectedLanguage: string
  targetCountry: string
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
      // Extract domain from URL
      const url = new URL(websiteUrl)
      const domain = url.hostname.replace("www.", "")

      // Check cache first
      const cached = await this.cache.getCachedResponse(
        { url: websiteUrl },
        "website_analyzer",
        "full_analysis"
      )
      if (cached) {
        console.log("🎯 Cache HIT: Website analysis")
        return cached
      }

      // Step 1: Get website content from page
      const websiteContent = await this.fetchWebsiteContent(websiteUrl)

      // Step 2: Get keywords suggestions from DataForSEO
      const suggestedKeywords = await this.dataForSEO.getKeywordsForSite(domain)

      // Step 3: Analyze with AI
      const aiAnalysis = await this.analyzeWithAI({
        url: websiteUrl,
        domain,
        content: websiteContent,
        existingKeywords: suggestedKeywords.slice(0, 10),
      })

      // Step 4: Combine all insights
      const insights: WebsiteInsights = {
        domain,
        detectedLanguage: this.detectLanguage(websiteContent, domain),
        targetCountry: this.detectCountry(domain, websiteContent),
        industry: aiAnalysis.industry,
        businessType: aiAnalysis.businessType,
        suggestedKeywords: [...new Set([
          ...suggestedKeywords.slice(0, 15),
          ...(aiAnalysis.keywords || []).slice(0, 15),
        ])].slice(0, 30),
        websiteQuality: this.calculateQualityScore(websiteContent),
        competitiveness: aiAnalysis.competitiveness,
        businessModel: aiAnalysis.businessModel,
        targetAudience: aiAnalysis.targetAudience,
      }

      // Cache the results for 90 days
      await this.cache.setCachedResponse(
        { url: websiteUrl },
        "website_analyzer",
        "full_analysis",
        insights
      )

      return insights
    } catch (error) {
      console.error("Website analysis error:", error)
      
      // Return basic insights on error
      const url = new URL(websiteUrl)
      const domain = url.hostname.replace("www.", "")
      
      return {
        domain,
        detectedLanguage: "fr",
        targetCountry: "FR",
        industry: "general",
        businessType: "b2c",
        suggestedKeywords: [],
        websiteQuality: 50,
        competitiveness: "medium",
        businessModel: "service",
        targetAudience: "general",
      }
    }
  }

  /**
   * Fetch website content
   */
  private async fetchWebsiteContent(url: string): Promise<string> {
    try {
      console.log(`🌐 Fetching content from ${url}`)
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; GoogleAdsAnalyzer/1.0)",
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status}`)
      }

      const html = await response.text()
      console.log(`📄 Fetched ${html.length} characters from ${url}`)
      
      // Extract text content from HTML (basic extraction)
      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 5000) // Limit to 5000 chars

      console.log(`📝 Extracted ${textContent.length} characters of text content`)
      return textContent
    } catch (error) {
      console.error("Error fetching website content:", error)
      // Return fallback content based on domain
      const domain = new URL(url).hostname.replace("www.", "")
      return `Site web: ${domain}. Service professionnel en ligne.`
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
      "nous", "vous", "avec", "pour", "dans", "sur", "est", "sont",
      "être", "avoir", "faire", "dire", "aller", "voir", "savoir",
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
    }

    for (const [tld, country] of Object.entries(tldMapping)) {
      if (domain.endsWith(tld)) {
        return country
      }
    }

    // Check for country mentions in content
    if (content.includes("France") || content.includes("français")) return "FR"
    if (content.includes("Belgium") || content.includes("Belgique")) return "BE"
    if (content.includes("Canada")) return "CA"
    
    // Default to France for French market
    return "FR"
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
      "contact", "service", "produit", "product",
      "prix", "price", "devis", "quote",
      "client", "customer", "solution",
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