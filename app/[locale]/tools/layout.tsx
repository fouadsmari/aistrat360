import { ReactNode } from "react"
import { getTranslations } from "next-intl/server"
import { Card, CardContent } from "@/components/ui/card"

interface ToolsLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "tools" })

  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function ToolsLayout({
  children,
  params,
}: ToolsLayoutProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "tools" })

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("description")}</p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  )
}
