import { CacheManager } from "./cache-manager"

interface DataForSEOConfig {
  login: string
  password: string
  baseUrl?: string
}

interface KeywordData {
  keyword: string
  search_volume?: number
  cpc?: number
  competition?: number
  monthly_searches?: number[]
}

interface WebsiteAnalysisData {
  domain: string
  title?: string
  description?: string
  keywords?: string[]
  language?: string
  country?: string
  technologies?: string[]
}

export class DataForSEOClient {
  private config: DataForSEOConfig
  private cache: CacheManager
  private authHeader: string

  constructor() {
    console.log(
      `🔷 [DATAFORSEO] Constructor called at ${new Date().toISOString()}`
    )
    console.log(`🔷 [DATAFORSEO] Environment check:`)
    console.log(
      `  - DATAFORSEO_LOGIN: ${process.env.DATAFORSEO_LOGIN ? "SET ✅" : "NOT SET ❌"}`
    )
    console.log(
      `  - DATAFORSEO_PASSWORD: ${process.env.DATAFORSEO_PASSWORD ? "SET ✅" : "NOT SET ❌"}`
    )
    console.log(
      `  - DATAFORSEO_CREDENTIALS: ${process.env.DATAFORSEO_CREDENTIALS ? "SET ✅" : "NOT SET ❌"}`
    )

    this.config = {
      login: process.env.DATAFORSEO_LOGIN!,
      password: process.env.DATAFORSEO_PASSWORD!,
      baseUrl: "https://api.dataforseo.com",
    }

    console.log(
      `🔷 [DATAFORSEO] Config created with login: ${this.config.login?.substring(0, 5)}***`
    )

    // Create Basic Auth header
    const credentials = `${this.config.login}:${this.config.password}`
    this.authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`
    console.log(
      `🔷 [DATAFORSEO] Auth header created, length: ${this.authHeader.length}`
    )

    this.cache = new CacheManager()
    console.log(`✅ [DATAFORSEO] Constructor completed`)
  }

  /**
   * Get keyword search volume and CPC data with proper geo-targeting
   */
  async getKeywordData(
    keywords: string[],
    country: string = "FR",
    language: string = "fr"
  ): Promise<KeywordData[]> {
    // Map country codes to DataForSEO location codes
    const locationMapping: Record<string, number> = {
      CA: 2124, // Canada
      US: 2840, // United States
      FR: 2250, // France
      BE: 2056, // Belgium
      CH: 2756, // Switzerland
      GB: 2826, // United Kingdom
      DE: 2276, // Germany
      ES: 2724, // Spain
      IT: 2380, // Italy
      NL: 2528, // Netherlands
    }

    // Map countries to language codes
    const languageMapping: Record<string, string> = {
      CA: language === "fr" ? "fr" : "en", // Canada can be French or English
      US: "en",
      FR: "fr",
      BE: language === "fr" ? "fr" : "nl",
      CH: language === "fr" ? "fr" : "de",
      GB: "en",
      DE: "de",
      ES: "es",
      IT: "it",
      NL: "nl",
    }

    const location_code = locationMapping[country] || 2250 // Default to France
    const language_code = languageMapping[country] || "fr"

    console.log(
      `🌍 DataForSEO: Using location ${location_code} (${country}) with language ${language_code}`
    )

    const inputData = {
      keywords: keywords.sort(),
      location_code,
      language_code,
    }

    // Check cache first
    const cached = await this.cache.getCachedResponse(
      inputData,
      "dataforseo",
      "search_volume"
    )
    if (cached) {
      console.log(`✅ [DATAFORSEO] Cache hit! Returning cached data`)
      return cached
    }
    console.log(`⚠️ [DATAFORSEO] Cache miss, making API call...`)

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v3/keywords_data/google_ads/search_volume/live`,
        {
          method: "POST",
          headers: {
            Authorization: this.authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              keywords,
              location_code,
              language_code,
            },
          ]),
        }
      )

      if (!response.ok) {
        throw new Error(
          `DataForSEO API error: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()

      if (data.tasks?.[0]?.result) {
        const results = data.tasks[0].result.map((item: any) => ({
          keyword: item.keyword,
          search_volume: item.search_volume || 0,
          cpc: item.cpc || 0,
          competition: item.competition || 0,
          monthly_searches: item.monthly_searches || [],
        }))

        // Cache the results
        await this.cache.setCachedResponse(
          inputData,
          "dataforseo",
          "search_volume",
          results
        )

        return results
      }

      return []
    } catch (error) {
      console.error("❌ DataForSEO API error:", error)
      throw new Error("Failed to get keyword data from DataForSEO API")
    }
  }

  /**
   * Get HTML content from website using DataForSEO
   */
  async getWebsiteHTML(websiteUrl: string): Promise<string> {
    console.log(
      `\n🔷 [DATAFORSEO] getWebsiteHTML() called at ${new Date().toISOString()}`
    )
    console.log(`🔷 [DATAFORSEO] URL to fetch: ${websiteUrl}`)

    const inputData = {
      url: websiteUrl,
      enable_javascript: true,
      enable_browser_rendering: true,
      load_resources: true,
    }

    // Check cache first
    console.log(`🔷 [DATAFORSEO] Checking cache for HTML...`)
    const cached = await this.cache.getCachedResponse(
      inputData,
      "dataforseo",
      "website_html"
    )
    if (cached) {
      console.log(`✅ [DATAFORSEO] Cache hit! Returning cached HTML`)
      return cached
    }
    console.log(`⚠️ [DATAFORSEO] Cache miss, making API call...`)

    try {
      // Use the instant_pages endpoint which is correct for HTML fetching
      const apiUrl = `${this.config.baseUrl}/v3/on_page/instant_pages`
      console.log(`🔷 [DATAFORSEO] API URL: ${apiUrl}`)

      const requestBody = [
        {
          url: websiteUrl,
          enable_javascript: true,
          enable_browser_rendering: true,
          load_resources: true,
        },
      ]
      console.log(
        `🔷 [DATAFORSEO] Request body:`,
        JSON.stringify(requestBody, null, 2)
      )

      console.log(`🔷 [DATAFORSEO] Making POST request for HTML...`)
      console.log(`🔷 [DATAFORSEO] Auth header present: ${!!this.authHeader}`)
      console.log(
        `🔷 [DATAFORSEO] Auth header length: ${this.authHeader?.length || 0}`
      )

      const startTime = Date.now()
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
      const duration = Date.now() - startTime
      console.log(
        `🔷 [DATAFORSEO] HTML response received in ${duration}ms, status: ${response.status}`
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(
          `❌ [DATAFORSEO] HTML fetch error (${response.status}):`,
          errorText
        )
        console.error(
          `❌ [DATAFORSEO] Response headers:`,
          Object.fromEntries(response.headers.entries())
        )
        throw new Error(
          `DataForSEO API error: ${response.status} ${response.statusText}`
        )
      }
      console.log(`✅ [DATAFORSEO] HTML response OK`)

      console.log(`🔷 [DATAFORSEO] Parsing HTML response JSON...`)
      const data = await response.json()
      console.log(`🔷 [DATAFORSEO] Response status code: ${data.status_code}`)
      console.log(
        `🔷 [DATAFORSEO] Response status message: ${data.status_message}`
      )

      if (data.status_code !== 20000) {
        console.error(`❌ [DATAFORSEO] API returned error:`, data)
        throw new Error(
          data.status_message || "Failed to fetch HTML from DataForSEO"
        )
      }
      console.log(`✅ [DATAFORSEO] Valid status code 20000`)

      // Check for HTML content in the response
      // First log what we have to understand the structure
      const item = data.tasks?.[0]?.result?.[0]?.items?.[0]
      if (item) {
        console.log(`🔷 [DATAFORSEO] Item keys available:`, Object.keys(item))
      }

      // Try multiple locations where HTML content might be
      let htmlContent = ""

      // Check for page_content which might contain the HTML
      if (item?.page_content) {
        console.log(
          `🔷 [DATAFORSEO] Found page_content, type:`,
          typeof item.page_content
        )
        if (typeof item.page_content === "string") {
          htmlContent = item.page_content
        } else if (typeof item.page_content === "object") {
          // If it's an object, try to extract text from it
          htmlContent =
            item.page_content.main_topic?.[0]?.text ||
            item.page_content.text ||
            item.page_content.content ||
            JSON.stringify(item.page_content)
        }
      }

      // Fallback to other possible locations
      if (!htmlContent) {
        htmlContent =
          item?.html || item?.meta?.content || item?.text || item?.content || ""
      }

      // Ensure htmlContent is a string
      if (typeof htmlContent !== "string") {
        console.log(
          `🔷 [DATAFORSEO] Converting non-string content to string, type was: ${typeof htmlContent}`
        )
        htmlContent = JSON.stringify(htmlContent)
      }

      console.log(
        `🔷 [DATAFORSEO] HTML content length: ${htmlContent?.length || 0} chars`
      )
      console.log(
        `🔷 [DATAFORSEO] HTML content preview: ${htmlContent?.substring(0, 200)}...`
      )

      if (!htmlContent || htmlContent.length === 0) {
        console.error(`❌ [DATAFORSEO] No HTML content in response`)
        console.error(
          `❌ [DATAFORSEO] Full item structure:`,
          JSON.stringify(item, null, 2).substring(0, 2000)
        )
        throw new Error("No HTML content received from DataForSEO")
      }

      // Cache the result for 7 days (HTML content changes less frequently)
      console.log(`🔷 [DATAFORSEO] Caching HTML content...`)
      await this.cache.setCachedResponse(
        inputData,
        "dataforseo",
        "website_html",
        htmlContent
      )
      console.log(`✅ [DATAFORSEO] HTML cached successfully`)

      console.log(`✅ [DATAFORSEO] getWebsiteHTML() completed successfully`)
      return htmlContent
    } catch (error) {
      console.error(`❌ [DATAFORSEO] Error fetching website HTML:`, error)
      console.error(`❌ [DATAFORSEO] Error details:`, {
        name: error?.constructor?.name,
        message: error instanceof Error ? error.message : "Unknown",
        stack:
          error instanceof Error
            ? error.stack?.split("\n").slice(0, 5)
            : "No stack",
      })
      throw new Error("Failed to fetch website HTML from DataForSEO API")
    }
  }

  /**
   * Get keywords for a specific website/domain
   */
  async getKeywordsForSite(
    target: string,
    location_code: number = 2250
  ): Promise<string[]> {
    const inputData = {
      target,
      location_code,
      language_code: "fr",
    }

    // Check cache first
    const cached = await this.cache.getCachedResponse(
      inputData,
      "dataforseo",
      "keywords_for_site"
    )
    if (cached) {
      return cached
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v3/keywords_data/google_ads/keywords_for_site/live`,
        {
          method: "POST",
          headers: {
            Authorization: this.authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              target,
              location_code,
              language_code: "fr",
              search_partners: false,
              limit: 30, // Get top 30 keywords
              sort_by: "search_volume",
            },
          ]),
        }
      )

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.tasks?.[0]?.result) {
        const keywords = data.tasks[0].result
          .map((item: any) => item.keyword)
          .filter(Boolean)
          .slice(0, 30) // Limit to 30 keywords

        // Cache the results
        await this.cache.setCachedResponse(
          inputData,
          "dataforseo",
          "keywords_for_site",
          keywords
        )

        return keywords
      }

      return []
    } catch (error) {
      console.error("❌ DataForSEO keywords API error:", error)
      throw new Error("Failed to get keyword suggestions from DataForSEO API")
    }
  }

  /**
   * Get traffic estimates for keywords with proper geo-targeting
   */
  async getTrafficEstimates(
    keywords: string[],
    bid: number = 2.0,
    country: string = "FR",
    language: string = "fr"
  ) {
    // Use same location mapping as getKeywordData
    const locationMapping: Record<string, number> = {
      CA: 2124, // Canada
      US: 2840, // United States
      FR: 2250, // France
      BE: 2056, // Belgium
      CH: 2756, // Switzerland
      GB: 2826, // United Kingdom
      DE: 2276, // Germany
      ES: 2724, // Spain
      IT: 2380, // Italy
      NL: 2528, // Netherlands
    }

    const languageMapping: Record<string, string> = {
      CA: language === "fr" ? "fr" : "en",
      US: "en",
      FR: "fr",
      BE: language === "fr" ? "fr" : "nl",
      CH: language === "fr" ? "fr" : "de",
      GB: "en",
      DE: "de",
      ES: "es",
      IT: "it",
      NL: "nl",
    }

    const location_code = locationMapping[country] || 2250
    const language_code = languageMapping[country] || "fr"

    const inputData = {
      keywords: keywords.sort(),
      bid,
      location_code,
      language_code,
    }

    // Check cache first
    const cached = await this.cache.getCachedResponse(
      inputData,
      "dataforseo",
      "traffic_estimates"
    )
    if (cached) {
      return cached
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v3/keywords_data/google_ads/ad_traffic_by_keywords/live`,
        {
          method: "POST",
          headers: {
            Authorization: this.authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              keywords,
              bid,
              match: "broad",
              location_code,
              language_code,
            },
          ]),
        }
      )

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.tasks?.[0]?.result) {
        const estimates = {
          impressions: data.tasks[0].result.impressions || 0,
          clicks: data.tasks[0].result.clicks || 0,
          average_cpc: data.tasks[0].result.average_cpc || 0,
          cost: data.tasks[0].result.cost || 0,
          ctr: data.tasks[0].result.ctr || 0,
        }

        // Cache the results
        await this.cache.setCachedResponse(
          inputData,
          "dataforseo",
          "traffic_estimates",
          estimates
        )

        return estimates
      }

      return null
    } catch (error) {
      throw error
    }
  }

  /**
   * Analyze website content and technology
   */
  async analyzeWebsite(domain: string): Promise<WebsiteAnalysisData> {
    const inputData = { domain }

    // Check cache first
    const cached = await this.cache.getCachedResponse(
      inputData,
      "dataforseo",
      "website_analysis"
    )
    if (cached) {
      return cached
    }

    try {
      // Use domain analytics technology endpoint
      const response = await fetch(
        `${this.config.baseUrl}/v3/domain_analytics/technologies/domain_technologies/live`,
        {
          method: "POST",
          headers: {
            Authorization: this.authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              target: domain,
              filters: ["technologies", "!=", null],
            },
          ]),
        }
      )

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.tasks?.[0]?.result?.items) {
        const techs = data.tasks[0].result.items.flatMap(
          (item: any) => item.technologies?.map((t: any) => t.name) || []
        )

        const analysis: WebsiteAnalysisData = {
          domain,
          technologies: techs,
          language: data.tasks[0].result.items[0]?.language || "fr",
          country: data.tasks[0].result.items[0]?.country || "FR",
        }

        // Cache the results
        await this.cache.setCachedResponse(
          inputData,
          "dataforseo",
          "website_analysis",
          analysis
        )

        return analysis
      }

      return { domain }
    } catch (error) {
      // Return basic data on error
      return { domain }
    }
  }

  /**
   * Get ranked keywords for a domain (Phase 2 - DataForSEO Labs API)
   * Limited to 900 keywords to stay under $0.10
   */
  async getRankedKeywords(
    domain: string,
    location: string = "FR",
    limit: number = 900
  ): Promise<any[]> {
    const locationMap: Record<string, number> = {
      FR: 2250, // France
      CA: 2124, // Canada
      US: 2840, // United States
      BE: 2056, // Belgium
      CH: 2756, // Switzerland
      UK: 2826, // United Kingdom
      DE: 2276, // Germany
      ES: 2724, // Spain
      IT: 2380, // Italy
    }

    const inputData = {
      domain,
      location_code: locationMap[location] || locationMap["FR"],
      language_code: location === "CA" ? "en" : location === "US" ? "en" : "fr",
      limit: Math.min(limit, 900), // Enforce 900 keyword limit
    }

    // Check cache first
    const cached = await this.cache.getCachedResponse(
      inputData,
      "dataforseo",
      "ranked_keywords"
    )
    if (cached) {
      console.log(
        `✅ [DATAFORSEO] Ranked keywords cache hit for domain: ${domain}`
      )
      return cached
    }

    try {
      console.log(
        `🔄 [DATAFORSEO] Fetching ranked keywords for domain: ${domain}`
      )

      const response = await fetch(
        `${this.config.baseUrl}/v3/dataforseo_labs/google/ranked_keywords/live`,
        {
          method: "POST",
          headers: {
            Authorization: this.authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              target: domain,
              location_code: inputData.location_code,
              language_code: inputData.language_code,
              limit: inputData.limit,
              offset: 0,
              filters: [
                ["keyword_data.keyword_info.search_volume", ">", 10], // Only keywords with volume > 10
              ],
              order_by: ["keyword_data.keyword_info.search_volume,desc"],
            },
          ]),
        }
      )

      if (!response.ok) {
        throw new Error(
          `DataForSEO API error: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()

      if (data.status_code !== 20000) {
        throw new Error(`DataForSEO error: ${data.status_message}`)
      }

      const keywords = data.tasks?.[0]?.result || []

      console.log(
        `✅ [DATAFORSEO] Retrieved ${keywords.length} ranked keywords`
      )

      // Cache the results for 90 days
      await this.cache.setCachedResponse(
        inputData,
        "dataforseo",
        "ranked_keywords",
        keywords
      )

      return keywords
    } catch (error) {
      console.error("❌ [DATAFORSEO] Ranked keywords API error:", error)
      throw error
    }
  }

  /**
   * Get keyword suggestions based on seed keywords (Phase 2 - DataForSEO Labs API)
   */
  async getKeywordSuggestions(
    keywords: string[],
    location: string = "FR",
    limit: number = 100
  ): Promise<any[]> {
    const locationMap: Record<string, number> = {
      FR: 2250,
      CA: 2124,
      US: 2840,
      BE: 2056,
      CH: 2756,
      UK: 2826,
      DE: 2276,
      ES: 2724,
      IT: 2380,
    }

    // Take up to 5 seed keywords to avoid too many suggestions
    const seedKeywords = keywords.slice(0, 5)

    const inputData = {
      keywords: seedKeywords.sort(),
      location_code: locationMap[location] || locationMap["FR"],
      language_code: location === "CA" ? "en" : location === "US" ? "en" : "fr",
      limit,
    }

    // Check cache first
    const cached = await this.cache.getCachedResponse(
      inputData,
      "dataforseo",
      "keyword_suggestions"
    )
    if (cached) {
      console.log(`✅ [DATAFORSEO] Keyword suggestions cache hit`)
      return cached
    }

    try {
      console.log(
        `🔄 [DATAFORSEO] Fetching keyword suggestions for: ${seedKeywords.join(", ")}`
      )

      const response = await fetch(
        `${this.config.baseUrl}/v3/dataforseo_labs/google/keyword_suggestions/live`,
        {
          method: "POST",
          headers: {
            Authorization: this.authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              keywords: seedKeywords,
              location_code: inputData.location_code,
              language_code: inputData.language_code,
              limit: inputData.limit,
              offset: 0,
              filters: [
                ["keyword_data.search_volume", ">", 50], // Only keywords with volume > 50
                ["keyword_data.keyword_difficulty", "<", 80], // Exclude very difficult keywords
              ],
              order_by: ["keyword_data.search_volume,desc"],
            },
          ]),
        }
      )

      if (!response.ok) {
        throw new Error(
          `DataForSEO API error: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()

      if (data.status_code !== 20000) {
        throw new Error(`DataForSEO error: ${data.status_message}`)
      }

      const suggestions = data.tasks?.[0]?.result || []

      console.log(
        `✅ [DATAFORSEO] Retrieved ${suggestions.length} keyword suggestions`
      )

      // Cache the results for 90 days
      await this.cache.setCachedResponse(
        inputData,
        "dataforseo",
        "keyword_suggestions",
        suggestions
      )

      return suggestions
    } catch (error) {
      console.error("❌ [DATAFORSEO] Keyword suggestions API error:", error)
      throw error
    }
  }

  /**
   * Calculate estimated cost for DataForSEO Labs analysis
   */
  calculateLabsCost(
    rankedKeywordsCount: number,
    suggestionsCount: number
  ): number {
    // DataForSEO Labs pricing:
    // - ranked_keywords: $0.11 per 1000 keywords (max 900 = ~$0.099)
    // - keyword_suggestions: $0.0115 per request (not per keyword)

    const rankedCost = (rankedKeywordsCount / 1000) * 0.11
    const suggestionsCost = suggestionsCount > 0 ? 0.0115 : 0

    return rankedCost + suggestionsCost
  }

  /**
   * Extract main keywords from page HTML content for suggestions
   */
  extractMainKeywords(pageContent: any, limit: number = 10): string[] {
    try {
      const item = pageContent.tasks?.[0]?.result?.[0]?.items?.[0]
      if (!item) return []

      const keywords = new Set<string>()

      // Extract from title
      if (item.meta?.title) {
        const titleWords = item.meta.title
          .toLowerCase()
          .replace(/[^\w\s]/g, " ")
          .split(/\s+/)
          .filter((word: string) => word.length > 3)
        titleWords.forEach((word: string) => keywords.add(word))
      }

      // Extract from H1 tags
      if (item.meta?.htags?.h1) {
        item.meta.htags.h1.forEach((h1: string) => {
          const h1Words = h1
            .toLowerCase()
            .replace(/[^\w\s]/g, " ")
            .split(/\s+/)
            .filter((word: string) => word.length > 3)
          h1Words.forEach((word: string) => keywords.add(word))
        })
      }

      // Extract from meta description
      if (item.meta?.description) {
        const descWords = item.meta.description
          .toLowerCase()
          .replace(/[^\w\s]/g, " ")
          .split(/\s+/)
          .filter((word: string) => word.length > 4)
          .slice(0, 5) // Top 5 from description
        descWords.forEach((word: string) => keywords.add(word))
      }

      return Array.from(keywords).slice(0, limit)
    } catch (error) {
      console.error("Error extracting keywords:", error)
      return []
    }
  }
}
