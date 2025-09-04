import { getRequestConfig } from "next-intl/server"
import { routing } from "./routing"

export default getRequestConfig(async ({ requestLocale }) => {
  // Use requestLocale instead of locale - this contains the actual locale from the URL
  let locale = await requestLocale

  // Validate that the incoming locale parameter is valid with strict logging
  if (!locale || !routing.locales.includes(locale as any)) {
    // Log invalid locale attempts for security monitoring
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[i18n] Invalid locale attempted: '${locale}', falling back to '${routing.defaultLocale}'`
      )
    }
    locale = routing.defaultLocale
  }

  // Load the appropriate messages based on locale
  const messages =
    locale === "en"
      ? (await import("@/messages/en.json")).default
      : (await import("@/messages/fr.json")).default

  return {
    locale,
    messages,
  }
})
