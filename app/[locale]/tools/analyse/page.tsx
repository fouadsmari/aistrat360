import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Target, BarChart3, DollarSign, TrendingUp } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnalyseForm } from "@/components/tools/analyse-form"

interface AnalysePageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({
    locale,
    namespace: "tools.analyse",
  })

  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function AnalysePage({ params }: AnalysePageProps) {
  const { locale } = await params
  const t = await getTranslations({
    locale,
    namespace: "tools.analyse",
  })

  // Fetch user quota
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userQuota = {
    remaining: 3,
    isUnlimited: false,
  }

  if (user) {
    // Get user's subscription pack
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        `
        subscription_pack_id,
        subscription_packs (
          analyses_per_month
        )
      `
      )
      .eq("id", user.id)
      .single()

    // Get current month usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: usedAnalyses } = await supabase
      .from("profitability_analyses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString())

    const monthlyLimit =
      (profile?.subscription_packs as any)?.analyses_per_month || 3
    const isUnlimited = monthlyLimit === -1
    const remaining = isUnlimited
      ? 999
      : Math.max(0, monthlyLimit - (usedAnalyses || 0))

    userQuota = {
      remaining,
      isUnlimited,
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Target className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          <h1 className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
            {t("title")}
          </h1>
          <Badge
            variant="secondary"
            className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300"
          >
            RÉVOLUTIONNAIRE
          </Badge>
        </div>
        <p className="text-muted-foreground mx-auto max-w-3xl text-lg">
          {t("description")}
        </p>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-gray-200 transition-colors hover:border-violet-200 dark:border-gray-800 dark:hover:border-violet-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              Analyse Automatique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Collez simplement votre URL de site web. Notre IA détecte
              automatiquement votre secteur, vos mots-clés et votre marché
              cible.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-gray-200 transition-colors hover:border-violet-200 dark:border-gray-800 dark:hover:border-violet-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              Prédiction ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Prédisez votre retour sur investissement AVANT de dépenser un
              euro. Évitez les erreurs coûteuses sur Google Ads.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-gray-200 transition-colors hover:border-violet-200 dark:border-gray-800 dark:hover:border-violet-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              Optimisation Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Obtenez des recommandations précises sur la répartition de votre
              budget pour maximiser vos résultats.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Form */}
      <AnalyseForm userQuota={userQuota} />
    </div>
  )
}
