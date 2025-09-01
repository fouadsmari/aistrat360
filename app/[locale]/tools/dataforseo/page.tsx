import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { DataForSEOAnalysis } from "@/components/tools/dataforseo-analysis"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tools.dataforseo")

  return {
    title: t("title"),
    description: t("description"),
  }
}

export default function DataForSEOPage() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <DataForSEOAnalysis />
    </div>
  )
}
