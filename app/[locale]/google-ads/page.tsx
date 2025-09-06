import { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { GoogleAdsAnalysis } from "@/components/google-ads/google-ads-analysis"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("googleAds")

  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function GoogleAdsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="container mx-auto space-y-6 py-6">
      <GoogleAdsAnalysis />
    </div>
  )
}
