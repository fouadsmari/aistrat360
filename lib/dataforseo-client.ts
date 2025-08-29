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
    console.log(`🔷 [DATAFORSEO] Constructor called at ${new Date().toISOString()}`)
    console.log(`🔷 [DATAFORSEO] Environment check:`)
    console.log(`  - DATAFORSEO_LOGIN: ${process.env.DATAFORSEO_LOGIN ? 'SET ✅' : 'NOT SET ❌'}`)
    console.log(`  - DATAFORSEO_PASSWORD: ${process.env.DATAFORSEO_PASSWORD ? 'SET ✅' : 'NOT SET ❌'}`)
    console.log(`  - DATAFORSEO_CREDENTIALS: ${process.env.DATAFORSEO_CREDENTIALS ? 'SET ✅' : 'NOT SET ❌'}`)
    
    this.config = {
      login: process.env.DATAFORSEO_LOGIN!,
      password: process.env.DATAFORSEO_PASSWORD!,
      baseUrl: "https://api.dataforseo.com",
    }
    
    console.log(`🔷 [DATAFORSEO] Config created with login: ${this.config.login?.substring(0, 5)}***`)

    // Create Basic Auth header
    const credentials = `${this.config.login}:${this.config.password}`
    this.authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`
    console.log(`🔷 [DATAFORSEO] Auth header created, length: ${this.authHeader.length}`)

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
    console.log(`\n🔷 [DATAFORSEO] getWebsiteHTML() called at ${new Date().toISOString()}`)
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
      console.log(`🔷 [DATAFORSEO] Request body:`, JSON.stringify(requestBody, null, 2))
      
      console.log(`🔷 [DATAFORSEO] Making POST request for HTML...`)
      console.log(`🔷 [DATAFORSEO] Auth header present: ${!!this.authHeader}`)
      console.log(`🔷 [DATAFORSEO] Auth header length: ${this.authHeader?.length || 0}`)
      
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
      console.log(`🔷 [DATAFORSEO] HTML response received in ${duration}ms, status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [DATAFORSEO] HTML fetch error (${response.status}):`, errorText)
        console.error(`❌ [DATAFORSEO] Response headers:`, Object.fromEntries(response.headers.entries()))
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`)
      }
      console.log(`✅ [DATAFORSEO] HTML response OK`)

      console.log(`🔷 [DATAFORSEO] Parsing HTML response JSON...`)
      const data = await response.json()
      console.log(`🔷 [DATAFORSEO] Response status code: ${data.status_code}`)
      console.log(`🔷 [DATAFORSEO] Response status message: ${data.status_message}`)
      
      if (data.status_code !== 20000) {
        console.error(`❌ [DATAFORSEO] API returned error:`, data)
        throw new Error(
          data.status_message || "Failed to fetch HTML from DataForSEO"
        )
      }
      console.log(`✅ [DATAFORSEO] Valid status code 20000`)

      // Check for HTML content in the response
      const htmlContent = data.tasks?.[0]?.result?.[0]?.items?.[0]?.html || ""
      console.log(`🔷 [DATAFORSEO] HTML content length: ${htmlContent.length} chars`)
      
      if (!htmlContent) {
        console.error(`❌ [DATAFORSEO] No HTML content in response`)
        console.error(`❌ [DATAFORSEO] Full response structure:`, JSON.stringify(data, null, 2).substring(0, 1000))
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
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : 'No stack'
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
}
