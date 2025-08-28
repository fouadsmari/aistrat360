// Simplified WebsiteAnalyzer - only provides utility methods for the new 4-step workflow

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
  constructor() {
    // No external dependencies needed for utility methods
  }

  // This class is now simplified to provide only utility methods for the new 4-step workflow

  // Old methods removed - HTML fetching is now done by DataForSEO API in the new 4-step workflow

  /**
   * Detect website language (utility method)
   */
  detectLanguage(content: string, domain: string): string {
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
   * Detect target country (utility method)
   */
  detectCountry(domain: string, content: string): string {
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
   * Calculate website quality score (utility method)
   */
  calculateQualityScore(content: string): number {
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
