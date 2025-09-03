import { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { KeywordAnalysis } from "@/components/tools/keyword-analysis"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sites")

  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function SitesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="container mx-auto space-y-6 py-6">
      <KeywordAnalysis />
    </div>
  )
}
