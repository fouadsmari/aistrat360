/**
 * Format currency based on country
 * For Canadian sites, use CAD
 * For US sites, use USD
 * For French/European sites, use EUR
 * Default to USD if unknown
 */
export function formatCurrency(amount: number, country?: string): string {
  // Determine currency based on country
  let currency = "USD"
  let symbol = "$"
  let locale = "en-US"

  if (country) {
    const countryUpper = country.toUpperCase()
    if (countryUpper === "CA" || countryUpper === "CANADA") {
      currency = "CAD"
      symbol = "CA$"
      locale = "en-CA"
    } else if (countryUpper === "FR" || countryUpper === "FRANCE") {
      currency = "EUR"
      symbol = "€"
      locale = "fr-FR"
    } else if (countryUpper === "US" || countryUpper === "USA") {
      currency = "USD"
      symbol = "$"
      locale = "en-US"
    }
  }

  // Format the currency
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Get currency symbol based on country
 */
export function getCurrencySymbol(country?: string): string {
  if (!country) return "$"

  const countryUpper = country.toUpperCase()
  if (countryUpper === "CA" || countryUpper === "CANADA") {
    return "CA$"
  } else if (countryUpper === "FR" || countryUpper === "FRANCE") {
    return "€"
  }
  return "$"
}
