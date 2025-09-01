import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { KeywordAnalysis } from "@/components/tools/keyword-analysis"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tools.keywords")

  return {
    title: t("title"),
    description: t("description"),
  }
}

export default function KeywordsPage() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <KeywordAnalysis />
    </div>
  )
}
