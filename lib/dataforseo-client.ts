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
    this.config = {
      login: process.env.DATAFORSEO_LOGIN!,
      password: process.env.DATAFORSEO_PASSWORD!,
      baseUrl: "https://api.dataforseo.com",
    }

    // Create Basic Auth header
    const credentials = `${this.config.login}:${this.config.password}`
    this.authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`

    this.cache = new CacheManager()
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
    const inputData = {
      url: websiteUrl,
      enable_content_parsing: true,
      enable_javascript: true,
    }

    // Check cache first
    const cached = await this.cache.getCachedResponse(
      inputData,
      "dataforseo",
      "website_html"
    )
    if (cached) {
      return cached
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v3/on_page/page_screenshot/live`,
        {
          method: "POST",
          headers: {
            Authorization: this.authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              url: websiteUrl,
              enable_content_parsing: true,
              enable_javascript: true,
              custom_user_agent: "Mozilla/5.0 (compatible; DataForSEO/1.0)",
            },
          ]),
        }
      )

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.tasks?.[0]?.result?.[0]) {
        const htmlContent = data.tasks[0].result[0].content?.plain_text || ""

        // Cache the result for 7 days (HTML content changes less frequently)
        await this.cache.setCachedResponse(
          inputData,
          "dataforseo",
          "website_html",
          htmlContent
        )

        return htmlContent
      }

      throw new Error("No HTML content received from DataForSEO")
    } catch (error) {
      console.error("❌ DataForSEO HTML fetch error:", error)
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
}
