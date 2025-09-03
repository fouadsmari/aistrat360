/**
 * Currency utilities for displaying values based on target country
 */

export interface CurrencyConfig {
  symbol: string
  position: "before" | "after"
  decimals: number
}

const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  // North America
  US: { symbol: "$", position: "before", decimals: 2 },
  CA: { symbol: "$", position: "before", decimals: 2 },

  // Europe
  FR: { symbol: "€", position: "after", decimals: 2 },
  BE: { symbol: "€", position: "after", decimals: 2 },
  CH: { symbol: "€", position: "after", decimals: 2 }, // Note: CH uses CHF but DataForSEO returns EUR
  DE: { symbol: "€", position: "after", decimals: 2 },
  ES: { symbol: "€", position: "after", decimals: 2 },
  IT: { symbol: "€", position: "after", decimals: 2 },
  NL: { symbol: "€", position: "after", decimals: 2 },

  // UK
  GB: { symbol: "£", position: "before", decimals: 2 },
  UK: { symbol: "£", position: "before", decimals: 2 },
}

/**
 * Format currency value based on target country
 * @param value - The numeric value to format
 * @param targetCountry - ISO country code (CA, FR, US, etc.)
 * @param decimals - Optional override for decimal places
 */
export function formatCurrency(
  value: number,
  targetCountry: string = "FR",
  decimals?: number
): string {
  const config = CURRENCY_CONFIGS[targetCountry] || CURRENCY_CONFIGS["FR"]
  const decimalPlaces = decimals !== undefined ? decimals : config.decimals
  const formattedValue = value.toFixed(decimalPlaces)

  if (config.position === "before") {
    return `${config.symbol}${formattedValue}`
  } else {
    return `${formattedValue}${config.symbol}`
  }
}

/**
 * Get currency symbol for a target country
 */
export function getCurrencySymbol(targetCountry: string = "FR"): string {
  const config = CURRENCY_CONFIGS[targetCountry] || CURRENCY_CONFIGS["FR"]
  return config.symbol
}

/**
 * Check if country uses dollar currency
 */
export function usesDollar(targetCountry: string): boolean {
  return ["US", "CA"].includes(targetCountry)
}

/**
 * Check if country uses euro currency
 */
export function usesEuro(targetCountry: string): boolean {
  return ["FR", "BE", "CH", "DE", "ES", "IT", "NL"].includes(targetCountry)
}

/**
 * Get formatted CPC display with proper currency based on target country
 * DataForSEO returns CPC in USD for North America and EUR for Europe
 */
export function formatCPC(
  cpcValue: number,
  targetCountry: string = "FR",
  showDecimals: boolean = true
): string {
  const decimals = showDecimals ? (cpcValue < 1 ? 3 : 2) : 0
  return formatCurrency(cpcValue, targetCountry, decimals)
}

/**
 * Format analysis cost based on target country
 * Hide cost if it's 0
 */
export function formatAnalysisCost(
  cost: number,
  targetCountry: string = "FR"
): string | null {
  if (cost <= 0) {
    return null
  }
  return formatCurrency(cost, targetCountry, 3)
}
