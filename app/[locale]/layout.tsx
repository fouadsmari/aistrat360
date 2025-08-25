import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { locales } from "@/i18n"
import { ThemeProvider } from "@/components/providers/theme-provider"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AIStrat360 - AI Strategy Platform",
  description: "Plateforme SaaS moderne pour la stratégie AI",
}

// Generate static params for all supported locales - REQUIRED for Vercel
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Validate that the incoming locale is valid
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Providing all messages to the client side
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
