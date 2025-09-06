"use client"

import { useState, useMemo, useEffect } from "react"
import { useTranslations } from "next-intl"
import { formatCurrency } from "@/lib/currency"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  TrendingUp,
  Target,
  DollarSign,
  Award,
  Search,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Megaphone,
} from "lucide-react"

interface DetailedKeyword {
  keyword: string
  searchVolume: number
  cpc: number
  competition: number
  difficulty: number
  intent: string
  type: string
}

interface GoogleAdsAnalysisData {
  id: string
  website: { name: string; url: string }
  rankedKeywords: DetailedKeyword[]
  keywordIdeas: DetailedKeyword[]
  summary: {
    avgSearchVolume: number
    avgCpc: number
    avgPosition: number
    totalEtv: number
    intentDistribution: Record<string, number>
  }
}

interface Props {
  analysisId: string
  websiteName: string
  summaryOnly?: boolean
  keywordsOnly?: boolean
  campaignsOnly?: boolean
}

export function GoogleAdsEnhancedResults({
  analysisId,
  websiteName,
  summaryOnly = false,
  keywordsOnly = false,
  campaignsOnly = false,
}: Props) {
  const t = useTranslations("googleAds.results")
  const tCards = useTranslations("googleAds.results.cards")
  const [data, setData] = useState<GoogleAdsAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch detailed analysis data
  useEffect(() => {
    const fetchDetailedData = async () => {
      try {
        const response = await fetch(
          `/api/tools/keywords/detailed/${analysisId}`
        )
        if (response.ok) {
          const detailedData = await response.json()
          setData(detailedData)
        }
      } catch (error) {
        console.error("Error fetching detailed data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (analysisId) {
      fetchDetailedData()
    }
  }, [analysisId])

  // Calculs spécifiques Google Ads
  const adMetrics = useMemo(() => {
    if (!data) return null

    const allKeywords = [...data.rankedKeywords, ...data.keywordIdeas]

    // Calcul du budget estimé
    const estimatedBudget = data.keywordIdeas.reduce(
      (sum, kw) => sum + kw.searchVolume * kw.cpc * 0.05, // 5% CTR estimé
      0
    )

    // Mots-clés à fort potentiel publicitaire
    const highValueKeywords = data.keywordIdeas
      .filter((kw) => kw.cpc > 1 && kw.searchVolume > 500)
      .sort((a, b) => b.searchVolume * b.cpc - a.searchVolume * a.cpc)
      .slice(0, 10)

    // Distribution par intention (importante pour Google Ads)
    const intentData = Object.entries(
      data.summary.intentDistribution || {}
    ).map(([intent, count]) => ({
      name:
        intent === "transactional"
          ? "Commercial"
          : intent === "informational"
            ? "Informatif"
            : intent === "navigational"
              ? "Navigation"
              : intent,
      value: count,
      percentage: Math.round((count / allKeywords.length) * 100),
    }))

    return {
      estimatedBudget: Math.round(estimatedBudget),
      highValueKeywords,
      intentData,
      totalVolume: allKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0),
      avgCpc: data.summary.avgCpc,
      commercialKeywords: allKeywords.filter(
        (kw) => kw.intent === "transactional" || kw.intent === "commercial"
      ).length,
    }
  }, [data])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500">
            Chargement des données avancées...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!data || !adMetrics) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">Données non disponibles</p>
        </CardContent>
      </Card>
    )
  }

  // Vue résumé pour le dashboard principal
  if (summaryOnly) {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Megaphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {tCards("googleAdsAnalysis")} - {websiteName}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Analyse publicitaire de{" "}
            {data.rankedKeywords.length + data.keywordIdeas.length} mots-clés
            avec potentiel commercial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(adMetrics.estimatedBudget, "CA")}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Budget mensuel estimé
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {adMetrics.commercialKeywords}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mots-clés commerciaux
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(adMetrics.avgCpc, "CA")}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                CPC moyen
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {data.keywordIdeas.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Opportunités publicitaires
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Vue campagnes - Nouvelle fonctionnalité
  if (campaignsOnly) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-600" />
              Recommandations de Campagnes
            </CardTitle>
            <CardDescription>
              Suggestions de groupes d&apos;annonces basées sur vos mots-clés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border-l-4 border-l-blue-600 bg-blue-50 p-4 dark:bg-blue-950/20">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  🎯 Campagne &quot;Mots-clés Commerciaux&quot;
                </h3>
                <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                  {adMetrics.commercialKeywords} mots-clés à fort potentiel de
                  conversion
                </p>
                <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  Budget recommandé:{" "}
                  {formatCurrency(adMetrics.estimatedBudget * 0.6, "CA")}/mois
                </p>
              </div>

              <div className="rounded-lg border-l-4 border-l-green-600 bg-green-50 p-4 dark:bg-green-950/20">
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  📈 Campagne &quot;Opportunités Long Tail&quot;
                </h3>
                <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                  Mots-clés spécifiques à faible concurrence mais bon volume
                </p>
                <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                  Budget recommandé:{" "}
                  {formatCurrency(adMetrics.estimatedBudget * 0.4, "CA")}/mois
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top mots-clés à fort potentiel publicitaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Top Mots-clés pour Google Ads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {adMetrics.highValueKeywords.slice(0, 8).map((kw, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      #{idx + 1}
                    </Badge>
                    <span className="font-medium">{kw.keyword}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {kw.searchVolume.toLocaleString()} recherches
                    </span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(kw.cpc, "CA")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Vue mots-clés détaillée
  if (keywordsOnly) {
    return (
      <div className="space-y-6">
        {/* Distribution par intention */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Distribution par Intention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={adMetrics.intentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) =>
                        `${name}: ${percentage}%`
                      }
                    >
                      {adMetrics.intentData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.name === "Commercial"
                              ? "#10b981"
                              : entry.name === "Informatif"
                                ? "#3b82f6"
                                : entry.name === "Navigation"
                                  ? "#8b5cf6"
                                  : "#6b7280"
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Volume vs CPC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adMetrics.highValueKeywords.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="keyword"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "cpc"
                          ? formatCurrency(Number(value), "CA")
                          : value,
                        name === "cpc" ? "CPC" : "Volume",
                      ]}
                    />
                    <Bar dataKey="searchVolume" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top 10 opportunités */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Top 10 Opportunités Google Ads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {adMetrics.highValueKeywords.slice(0, 10).map((kw, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      #{idx + 1}
                    </Badge>
                    <div>
                      <span className="font-medium">{kw.keyword}</span>
                      <div className="text-xs text-gray-500">
                        Difficulté: {kw.difficulty}% • Intent: {kw.intent}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {formatCurrency(kw.cpc, "CA")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {kw.searchVolume.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Vue complète par défaut
  return (
    <div className="space-y-6">
      {/* Distribution par intention */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribution par Intention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={adMetrics.intentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {adMetrics.intentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === "Commercial"
                            ? "#10b981"
                            : entry.name === "Informatif"
                              ? "#3b82f6"
                              : entry.name === "Navigation"
                                ? "#8b5cf6"
                                : "#6b7280"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Volume vs CPC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adMetrics.highValueKeywords.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="keyword"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={10}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "cpc"
                        ? formatCurrency(Number(value), "CA")
                        : value,
                      name === "cpc" ? "CPC" : "Volume",
                    ]}
                  />
                  <Bar dataKey="searchVolume" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top mots-clés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            Top Opportunités Google Ads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {adMetrics.highValueKeywords.slice(0, 8).map((kw, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    #{idx + 1}
                  </Badge>
                  <span className="font-medium">{kw.keyword}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    {kw.searchVolume.toLocaleString()} recherches
                  </span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(kw.cpc, "CA")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
