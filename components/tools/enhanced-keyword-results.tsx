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
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GroupedKeywordResults } from "./grouped-keyword-results"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Eye,
  ExternalLink,
  Award,
  Crown,
  Target,
  Calendar,
  DollarSign,
  BarChart3,
  Zap,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Users,
  Globe,
  Search,
  Hash,
  Clock,
  Activity,
  Shield,
  Star,
  FileText,
} from "lucide-react"

interface DetailedKeyword {
  keyword: string
  searchVolume: number
  cpc: number
  competition: number
  competitionLevel: string
  difficulty: number
  intent: string
  foreignIntent: string[]
  monthlySearches: Array<{ year: number; month: number; search_volume: number }>
  trends: { yearly: number; monthly: number; quarterly: number }
  currentPosition: number | null
  previousPosition: number | null
  isUp: boolean
  isDown: boolean
  isNew: boolean
  url: string | null
  title: string | null
  description: string | null
  domain: string | null
  etv: number
  estimatedPaidCost: number
  backlinks: any
  serpFeatures: string[]
  categories: number[]
  lastUpdated: string
}

interface EnhancedAnalysisData {
  id: string
  website: { name: string; url: string }
  rankedKeywords: DetailedKeyword[]
  suggestions: DetailedKeyword[]
  summary: {
    avgSearchVolume: number
    avgCpc: number
    avgPosition: number
    totalEtv: number
    totalPaidValue: number
  }
}

interface Props {
  analysisId: string
  websiteName: string
}

export function EnhancedKeywordResults({ analysisId, websiteName }: Props) {
  const t = useTranslations("tools.keywords.results")
  const tCards = useTranslations("tools.keywords.results.cards")
  const [data, setData] = useState<EnhancedAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedKeyword, setSelectedKeyword] =
    useState<DetailedKeyword | null>(null)
  const [showKeywordModal, setShowKeywordModal] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch enhanced data
  useEffect(() => {
    const fetchDetailedData = async () => {
      try {
        const response = await fetch(
          `/api/tools/keywords/detailed/${analysisId}`
        )
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error("Failed to fetch detailed analysis:", error)
      } finally {
        setLoading(false)
      }
    }

    if (analysisId) {
      fetchDetailedData()
    }
  }, [analysisId])

  const toggleCard = (cardId: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId)
    } else {
      newExpanded.add(cardId)
    }
    setExpandedCards(newExpanded)
  }

  const openKeywordModal = (keyword: DetailedKeyword) => {
    setSelectedKeyword(keyword)
    setShowKeywordModal(true)
  }

  // Prepare chart data
  const monthlyTrendData = useMemo(() => {
    if (!selectedKeyword?.monthlySearches) return []

    return selectedKeyword.monthlySearches
      .map((item) => ({
        month: `${item.year}-${item.month.toString().padStart(2, "0")}`,
        volume: item.search_volume,
        monthName: new Date(item.year, item.month - 1).toLocaleDateString(
          "fr-FR",
          { month: "short" }
        ),
      }))
      .reverse()
  }, [selectedKeyword])

  const competitionDistribution = useMemo(() => {
    if (!data?.rankedKeywords && !data?.suggestions) return []

    // Combiner tous les mots-clés (ranked + suggestions)
    const allKeywords = [
      ...(data.rankedKeywords || []),
      ...(data.suggestions || []),
    ]
    if (allKeywords.length === 0) return []

    const levels = { LOW: 0, MEDIUM: 0, HIGH: 0, UNKNOWN: 0 }
    allKeywords.forEach((kw) => {
      const level = kw.competitionLevel || "UNKNOWN"
      levels[level as keyof typeof levels] += 1
    })

    return Object.entries(levels).map(([level, count]) => ({
      name: level,
      value: count,
      color:
        level === "LOW"
          ? "#10b981"
          : level === "MEDIUM"
            ? "#f59e0b"
            : level === "HIGH"
              ? "#ef4444"
              : "#6b7280",
    }))
  }, [data])

  const intentDistribution = useMemo(() => {
    if (!data?.rankedKeywords && !data?.suggestions) return []

    // Combiner tous les mots-clés (ranked + suggestions)
    const allKeywords = [
      ...(data.rankedKeywords || []),
      ...(data.suggestions || []),
    ]
    if (allKeywords.length === 0) return []

    const intents: { [key: string]: number } = {}
    allKeywords.forEach((kw) => {
      intents[kw.intent] = (intents[kw.intent] || 0) + 1
    })

    return Object.entries(intents).map(([intent, count]) => ({
      intent,
      count,
      percentage: Math.round((count / allKeywords.length) * 100),
    }))
  }, [data])

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case "transactional":
        return <DollarSign className="h-4 w-4 text-green-500" />
      case "informational":
        return <Search className="h-4 w-4 text-blue-500" />
      case "navigational":
        return <Globe className="h-4 w-4 text-purple-500" />
      default:
        return <Hash className="h-4 w-4 text-gray-500" />
    }
  }

  const getPositionTrend = (keyword: DetailedKeyword) => {
    if (keyword.isNew)
      return (
        <Badge className="bg-blue-500">
          <Star className="mr-1 h-3 w-3" />
          New
        </Badge>
      )
    if (keyword.isUp)
      return (
        <Badge className="bg-green-500">
          <ArrowUp className="mr-1 h-3 w-3" />↑
        </Badge>
      )
    if (keyword.isDown)
      return (
        <Badge className="bg-red-500">
          <ArrowDown className="mr-1 h-3 w-3" />↓
        </Badge>
      )
    return (
      <Badge variant="outline">
        <Minus className="mr-1 h-3 w-3" />-
      </Badge>
    )
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return "text-green-600"
    if (difficulty <= 70) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className="ml-2">{t("loading")}...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="py-8 text-center text-gray-500">{t("noResults")}</div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Dashboard */}
      <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 dark:border-violet-800 dark:from-violet-950/30 dark:to-purple-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Award className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            {tCards("completeAnalysis")} - {websiteName}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Données enrichies de {data.rankedKeywords.length} mots-clés avec
            insights concurrentiels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mots-clés positionnés - Première ligne */}
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Target className="h-5 w-5 text-blue-600" />
              {tCards("rankedKeywords")}
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data.rankedKeywords.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {tCards("number")}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(
                    data.rankedKeywords.reduce(
                      (sum, kw) => sum + kw.searchVolume,
                      0
                    ) / data.rankedKeywords.length
                  ).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {tCards("avgVolume")}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  #{data.summary.avgPosition}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {tCards("avgPosition")}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(
                    data.rankedKeywords.reduce((sum, kw) => sum + kw.cpc, 0) /
                      data.rankedKeywords.length,
                    "CA"
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {tCards("avgCpc")}
                </div>
              </div>
            </div>
          </div>

          {/* Mots-clés suggérés - Deuxième ligne */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Zap className="h-5 w-5 text-green-600" />
              {tCards("suggestedKeywords")}
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {data.suggestions.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {tCards("number")}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {data.suggestions.length > 0
                    ? Math.round(
                        data.suggestions.reduce(
                          (sum, kw) => sum + kw.searchVolume,
                          0
                        ) / data.suggestions.length
                      ).toLocaleString()
                    : "0"}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {tCards("avgVolume")}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  -
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {tCards("avgPosition")}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {data.suggestions.length > 0
                    ? formatCurrency(
                        data.suggestions.reduce((sum, kw) => sum + kw.cpc, 0) /
                          data.suggestions.length,
                        "CA"
                      )
                    : formatCurrency(0, "CA")}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {tCards("avgCpc")}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-violet-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-violet-400"
          >
            <BarChart3 className="h-4 w-4" />
            {t("overview")}
          </TabsTrigger>
          <TabsTrigger
            value="keywords"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-violet-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-violet-400"
          >
            <Search className="h-4 w-4" />
            {t("keywords")}
          </TabsTrigger>
          <TabsTrigger
            value="pages"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-violet-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-violet-400"
          >
            <FileText className="h-4 w-4" />
            Pages
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Competition Distribution */}
            <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  {tCards("competitionDistribution")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={competitionDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {competitionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap gap-2">
                  {competitionDistribution.map((item) => (
                    <Badge
                      key={item.name}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      {item.name}: {item.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Intent Analysis */}
            <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  {tCards("intentAnalysis")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {intentDistribution.map((item) => (
                    <div
                      key={item.intent}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {getIntentIcon(item.intent)}
                        <span className="capitalize">{item.intent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={item.percentage} className="w-20" />
                        <span className="text-sm font-medium">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <div className="grid gap-4">
            {data.rankedKeywords.slice(0, 20).map((keyword, index) => (
              <Card
                key={keyword.keyword}
                className="cursor-pointer border-gray-200 bg-white transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                onClick={() => openKeywordModal(keyword)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-violet-600 dark:text-violet-400">
                        {keyword.keyword}
                      </div>
                      {getPositionTrend(keyword)}
                      {getIntentIcon(keyword.intent)}
                    </div>
                    <div className="flex items-center gap-2">
                      {keyword.currentPosition && (
                        <Badge variant="outline">
                          #{keyword.currentPosition}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                      <div className="text-gray-500">{t("searchVolume")}</div>
                      <div className="font-medium">
                        {keyword.searchVolume.toLocaleString()}/mois
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">{t("cpc")}</div>
                      <div className="font-medium">
                        {formatCurrency(keyword.cpc, "CA")}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">{t("difficulty")}</div>
                      <div
                        className={`font-medium ${getDifficultyColor(keyword.difficulty)}`}
                      >
                        {keyword.difficulty > 0
                          ? `${keyword.difficulty}%`
                          : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Valeur</div>
                      <div className="font-medium text-green-600">
                        {formatCurrency(keyword.etv, "CA")}
                      </div>
                    </div>
                  </div>

                  {keyword.description && (
                    <div className="mt-3 truncate text-sm text-gray-600">
                      {keyword.description}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          <GroupedKeywordResults
            analysisId={analysisId}
            websiteName={websiteName}
          />
        </TabsContent>
      </Tabs>

      {/* Keyword Detail Modal */}
      <Dialog open={showKeywordModal} onOpenChange={setShowKeywordModal}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          {selectedKeyword && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  {selectedKeyword.keyword}
                </DialogTitle>
                <DialogDescription>
                  Analyse détaillée et historique des performances
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg bg-blue-50 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedKeyword.searchVolume.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t("searchVolume")}/mois
                    </div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      #{selectedKeyword.currentPosition || "N/A"}
                    </div>
                    <div className="text-sm text-gray-600">{t("position")}</div>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(selectedKeyword.cpc, "CA")}
                    </div>
                    <div className="text-sm text-gray-600">{t("cpc")}</div>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-4 text-center">
                    <div
                      className={`text-2xl font-bold ${getDifficultyColor(selectedKeyword.difficulty)}`}
                    >
                      {selectedKeyword.difficulty > 0
                        ? `${selectedKeyword.difficulty}%`
                        : "N/A"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t("difficulty")}
                    </div>
                  </div>
                </div>

                {/* Trend Chart */}
                {monthlyTrendData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Tendance de Volume (12 mois)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="monthName" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [
                              `${value} recherches`,
                              "Volume",
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="volume"
                            stroke="#3b82f6"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Details */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Détails SEO</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Intent:</span>
                        <div className="flex items-center gap-1">
                          {getIntentIcon(selectedKeyword.intent)}
                          <span className="capitalize">
                            {selectedKeyword.intent}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Concurrence:
                        </span>
                        <Badge
                          variant={
                            selectedKeyword.competitionLevel === "LOW"
                              ? "default"
                              : selectedKeyword.competitionLevel === "MEDIUM"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {selectedKeyword.competitionLevel}
                        </Badge>
                      </div>
                      {selectedKeyword.serpFeatures.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600">
                            SERP Features:
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selectedKeyword.serpFeatures.map((feature) => (
                              <Badge
                                key={feature}
                                variant="outline"
                                className="text-xs"
                              >
                                {feature.replace("_", " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">ETV:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(selectedKeyword.etv, "CA")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Coût Pub Estimé:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            selectedKeyword.estimatedPaidCost,
                            "CA"
                          )}
                        </span>
                      </div>
                      {selectedKeyword.trends && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Tendance Annuelle:
                          </span>
                          <span
                            className={`flex items-center gap-1 font-medium ${
                              selectedKeyword.trends.yearly > 0
                                ? "text-green-600"
                                : selectedKeyword.trends.yearly < 0
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {selectedKeyword.trends.yearly > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : selectedKeyword.trends.yearly < 0 ? (
                              <TrendingDown className="h-4 w-4" />
                            ) : null}
                            {selectedKeyword.trends.yearly}%
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Page Info */}
                {selectedKeyword.url && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Globe className="h-5 w-5" />
                        Page qui Rank
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">URL:</span>
                          <a
                            href={selectedKeyword.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            {selectedKeyword.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {selectedKeyword.title && (
                          <div>
                            <span className="text-sm text-gray-600">
                              Titre:
                            </span>
                            <p className="mt-1 text-sm">
                              {selectedKeyword.title}
                            </p>
                          </div>
                        )}
                        {selectedKeyword.description && (
                          <div>
                            <span className="text-sm text-gray-600">
                              Description:
                            </span>
                            <p className="mt-1 text-sm text-gray-700">
                              {selectedKeyword.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
