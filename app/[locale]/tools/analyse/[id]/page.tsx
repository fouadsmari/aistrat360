import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { KeywordTable } from "@/components/tools/keyword-table"
import {
  Target,
  TrendingUp,
  DollarSign,
  Users,
  MousePointer,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
  Download,
  Share,
  Search,
  BarChart3,
} from "lucide-react"

interface AnalysisPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function AnalysisResultPage({
  params,
}: AnalysisPageProps) {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: "tools.analyse" })

  // Fetch analysis data
  const supabase = await createSupabaseServerClient()

  const { data: analysis, error } = await supabase
    .from("profitability_analyses")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !analysis) {
    notFound()
  }

  // Check if analysis is still processing
  if (analysis.status === "processing" || analysis.status === "pending") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-lg">
          <CardContent className="p-8 text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-violet-600" />
            <h2 className="mb-2 text-xl font-semibold">
              {t("status.processing")}
            </h2>
            <p className="text-muted-foreground mb-4">
              Votre analyse est en cours. Cela peut prendre 2-3 minutes.
            </p>
            <Progress value={analysis.progress} className="mb-4" />
            <p className="text-muted-foreground text-sm">
              {analysis.progress}% terminé
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if analysis failed
  if (analysis.status === "failed") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-lg border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
            <h2 className="mb-2 text-xl font-semibold">
              Erreur d&apos;analyse
            </h2>
            <p className="text-muted-foreground">
              Une erreur s&apos;est produite lors de l&apos;analyse. Veuillez
              réessayer.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Parse result data
  const results = analysis.result_data
  const inputData = analysis.input_data

  // Get currency symbol based on website analysis
  const currencySymbol = results?.websiteAnalysis?.currencySymbol || "€"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Résultats de l&apos;analyse</h1>
          <p className="text-muted-foreground mt-2">
            Analyse pour {inputData.websiteUrl}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share className="mr-2 h-4 w-4" />
            Partager
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* ROI Prediction Hero */}
      <Card className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <CardContent className="p-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <TrendingUp className="mx-auto mb-2 h-8 w-8" />
              <div className="text-3xl font-bold">
                +{results?.roiPrediction?.roiPercentage || 0}%
              </div>
              <div className="text-sm opacity-90">ROI Prédit</div>
            </div>
            <div className="text-center">
              <Calendar className="mx-auto mb-2 h-8 w-8" />
              <div className="text-3xl font-bold">
                {results?.roiPrediction?.breakEvenDays || 0}
              </div>
              <div className="text-sm opacity-90">Jours pour rentabiliser</div>
            </div>
            <div className="text-center">
              <CheckCircle className="mx-auto mb-2 h-8 w-8" />
              <div className="text-3xl font-bold">
                {results?.roiPrediction?.confidence || "medium"}
              </div>
              <div className="text-sm opacity-90">Niveau de confiance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              <MousePointer className="mr-2 inline h-4 w-4" />
              Clics/mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results?.roiPrediction?.estimatedClicks || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              <Users className="mr-2 inline h-4 w-4" />
              Leads/mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results?.roiPrediction?.estimatedLeads || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              <DollarSign className="mr-2 inline h-4 w-4" />
              Coût réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencySymbol}
              {results?.roiPrediction?.estimatedCost || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              <Target className="mr-2 inline h-4 w-4" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results?.roiPrediction?.estimatedConversions || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keywords Data Table */}
      {results?.recommendedKeywords &&
        results.recommendedKeywords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-violet-600" />
                Analyse des mots-clés recommandés
              </CardTitle>
              <CardDescription>
                Données détaillées avec volumes de recherche, coûts et
                difficulté
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KeywordTable
                keywords={results.recommendedKeywords}
                currencySymbol={currencySymbol}
                targetCountry={results?.websiteAnalysis?.targetCountry || "FR"}
              />
            </CardContent>
          </Card>
        )}

      {/* Recommendations */}
      {results?.recommendations && results.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommandations personnalisées</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.recommendations.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
