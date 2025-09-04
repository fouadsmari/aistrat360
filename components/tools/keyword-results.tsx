"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCPC, getCurrencySymbol } from "@/lib/currency-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart3,
  TrendingUp,
  Target,
  DollarSign,
  Download,
  Search,
  Filter,
  Eye,
  ExternalLink,
  Hash,
  Award,
  Globe,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { EnhancedKeywordResults } from "./enhanced-keyword-results"
import { GroupedKeywordResults } from "./grouped-keyword-results"

interface KeywordData {
  keyword: string
  type: "ranked" | "suggestion"
  searchVolume: number
  difficulty: number
  cpc: number
  position?: number
  url?: string
  // New rich data fields
  competition?: number
  competitionLevel?: string
  previousPosition?: number
  isUp?: boolean
  isDown?: boolean
  isNew?: boolean
  title?: string
  description?: string
  domain?: string
  intent?: string
  foreignIntent?: string[]
  monthlySearches?: Array<{
    year: number
    month: number
    search_volume: number
  }>
  trends?: { yearly: number; monthly: number; quarterly: number }
  etv?: number
  estimatedPaidCost?: number
  backlinks?: any
  serpFeatures?: string[]
  categories?: number[]
  lastUpdated?: string
}

interface AnalysisResults {
  id: string
  totalKeywords: number
  rankedKeywords: number
  opportunities: number
  cost: number
  keywords: KeywordData[]
  // New summary data
  summary?: {
    avgSearchVolume: number
    avgCpc: number
    avgPosition: number
    totalEtv: number
    intentDistribution: { [key: string]: number }
  }
}

interface Props {
  results: AnalysisResults
  websiteName: string
  targetCountry?: string
  hideEnhancedResults?: boolean
}

interface Filters {
  keywordType: "all" | "ranked" | "keywordIdeas"
  minVolume: string
  maxVolume: string
  minDifficulty: string
  maxDifficulty: string
  minCpc: string
  maxCpc: string
  minPosition: string
  maxPosition: string
  search: string
}

export function KeywordResults({
  results,
  websiteName,
  targetCountry = "FR",
  hideEnhancedResults = false,
}: Props) {
  const t = useTranslations("tools.keywords.results")
  const tFilters = useTranslations("tools.keywords.filters")
  const tCommon = useTranslations("common")
  const tTable = useTranslations("tools.keywords.results.table")

  const [filters, setFilters] = useState<Filters>({
    keywordType: "all",
    minVolume: "",
    maxVolume: "",
    minDifficulty: "",
    maxDifficulty: "",
    minCpc: "",
    maxCpc: "",
    minPosition: "",
    maxPosition: "",
    search: "",
  })

  const [viewMode, setViewMode] = useState<"list" | "grouped">("list")
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 30

  // Metrics calculations
  const metrics = useMemo(() => {
    const rankedKeywords = results.keywords.filter((k) => k.type === "ranked")
    const keywordIdeas = results.keywords.filter((k) => k.type === "suggestion")

    const totalVolume = results.keywords.reduce(
      (sum, k) => sum + k.searchVolume,
      0
    )
    const avgPosition =
      rankedKeywords.length > 0
        ? rankedKeywords.reduce((sum, k) => sum + (k.position || 0), 0) /
          rankedKeywords.length
        : 0

    const topKeywords = [...results.keywords]
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 10)

    // Calcul des opportunités : mots-clés suggérés avec bon volume et faible difficulté
    const opportunityKeywords = keywordIdeas
      .filter((k) => k.searchVolume > 500 && k.difficulty < 60)
      .sort((a, b) => {
        // Score d'opportunité basé sur volume / difficulté
        const scoreA =
          (a.searchVolume / Math.max(a.difficulty, 1)) * (a.cpc || 0.1)
        const scoreB =
          (b.searchVolume / Math.max(b.difficulty, 1)) * (b.cpc || 0.1)
        return scoreB - scoreA
      })

    return {
      totalVolume,
      avgPosition: Math.round(avgPosition * 10) / 10,
      topKeywords,
      opportunityKeywords,
      rankedKeywords: rankedKeywords.length,
      suggestions: keywordIdeas.length,
      opportunities: opportunityKeywords.length,
    }
  }, [results.keywords])

  // Filter and sort keywords
  // Helper function to get sortable value from keyword
  const getKeywordValue = (keyword: KeywordData, key: string): any => {
    switch (key) {
      case "keyword":
        return keyword.keyword.toLowerCase()
      case "searchVolume":
        return keyword.searchVolume
      case "difficulty":
        return keyword.difficulty
      case "cpc":
        return keyword.cpc
      case "position":
        return keyword.position || 999 // Put keywords without position at the end
      case "etv":
        return keyword.etv || 0
      default:
        return 0
    }
  }

  const filteredKeywords = useMemo(() => {
    let filtered = results.keywords.filter((keyword) => {
      // Type filter
      if (filters.keywordType === "ranked" && keyword.type !== "ranked")
        return false
      if (
        filters.keywordType === "keywordIdeas" &&
        keyword.type !== "suggestion"
      )
        return false

      // Search filter
      if (
        filters.search &&
        !keyword.keyword.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false
      }

      // Volume filters
      if (filters.minVolume) {
        const min = parseInt(filters.minVolume)
        if (keyword.searchVolume < min) return false
      }
      if (filters.maxVolume) {
        const max = parseInt(filters.maxVolume)
        if (keyword.searchVolume > max) return false
      }

      // Difficulty filters
      if (filters.minDifficulty) {
        const min = parseInt(filters.minDifficulty)
        if (keyword.difficulty < min) return false
      }
      if (filters.maxDifficulty) {
        const max = parseInt(filters.maxDifficulty)
        if (keyword.difficulty > max) return false
      }

      // CPC filters
      if (filters.minCpc) {
        const min = parseFloat(filters.minCpc)
        if (keyword.cpc < min) return false
      }
      if (filters.maxCpc) {
        const max = parseFloat(filters.maxCpc)
        if (keyword.cpc > max) return false
      }

      // Position filters (only for ranked keywords)
      if (filters.minPosition && keyword.position) {
        const min = parseInt(filters.minPosition)
        if (keyword.position < min) return false
      }
      if (filters.maxPosition && keyword.position) {
        const max = parseInt(filters.maxPosition)
        if (keyword.position > max) return false
      }

      return true
    })

    // Apply sorting
    if (sortConfig !== null) {
      filtered = filtered.sort((a, b) => {
        const aValue = getKeywordValue(a, sortConfig.key)
        const bValue = getKeywordValue(b, sortConfig.key)

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }, [results.keywords, filters, sortConfig])

  // Pagination
  const paginatedKeywords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredKeywords.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredKeywords, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredKeywords.length / itemsPerPage)

  // Handle sort
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "desc"
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "desc"
    ) {
      direction = "asc"
    }
    setSortConfig({ key, direction })
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      tTable("keyword"),
      tTable("type"),
      tTable("searchVolume"),
      tTable("difficulty"),
      tTable("cpc"),
      tTable("position"),
      tTable("url"),
    ]

    const csvContent = [
      headers.join(","),
      ...filteredKeywords.map((keyword) =>
        [
          `"${keyword.keyword}"`,
          keyword.type,
          keyword.searchVolume,
          keyword.difficulty,
          formatCPC(keyword.cpc, targetCountry),
          keyword.position || "",
          `"${keyword.url || ""}"`,
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `keyword-analysis-${websiteName}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30)
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    if (difficulty <= 60)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
    return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Sortable header component
  const SortableHeader = ({
    sortKey,
    children,
  }: {
    sortKey: string
    children: React.ReactNode
  }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortConfig?.key === sortKey &&
          (sortConfig.direction === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          ))}
      </div>
    </TableHead>
  )

  return (
    <div className="space-y-6">
      {!hideEnhancedResults && (
        <EnhancedKeywordResults
          analysisId={results.id}
          websiteName={websiteName}
        />
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-violet-600" />
                {t("title")}
              </CardTitle>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t("websiteLabel")}: <strong>{websiteName}</strong>
              </p>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {tCommon("export")} CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-600">
                {results.keywords.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("totalKeywords")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.rankedKeywords}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("rankedKeywords")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-600">
                {metrics.suggestions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Suggestions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.opportunities}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("opportunities")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(metrics.totalVolume)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("totalVolume")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Results View - Only visible in overview */}
      <div id="main-table-view">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {tFilters("title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>{tFilters("keywordType")}</Label>
                <Select
                  value={filters.keywordType}
                  onValueChange={(value: any) =>
                    setFilters((prev) => ({ ...prev, keywordType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <SelectItem value="all">{tFilters("all")}</SelectItem>
                    <SelectItem value="ranked">{tFilters("ranked")}</SelectItem>
                    <SelectItem value="keywordIdeas">
                      {tFilters("keywordIdeas")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{tFilters("searchKeywords")}</Label>
                <Input
                  placeholder={tFilters("searchPlaceholder")}
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>{tFilters("volumeRange")}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={tTable("min")}
                    type="number"
                    value={filters.minVolume}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minVolume: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder={tTable("max")}
                    type="number"
                    value={filters.maxVolume}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxVolume: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Difficulté (%)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={tTable("min")}
                    type="number"
                    min="0"
                    max="100"
                    value={filters.minDifficulty}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minDifficulty: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder={tTable("max")}
                    type="number"
                    min="0"
                    max="100"
                    value={filters.maxDifficulty}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxDifficulty: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Deuxième ligne de filtres */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>CPC ({getCurrencySymbol(targetCountry)})</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={tTable("min")}
                    type="number"
                    step="0.01"
                    min="0"
                    value={filters.minCpc}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minCpc: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder={tTable("max")}
                    type="number"
                    step="0.01"
                    min="0"
                    value={filters.maxCpc}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxCpc: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Position</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={tTable("min")}
                    type="number"
                    min="1"
                    max="100"
                    value={filters.minPosition}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minPosition: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder={tTable("max")}
                    type="number"
                    min="1"
                    max="100"
                    value={filters.maxPosition}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxPosition: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Active filters count */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t("showingResults", {
                  count: filteredKeywords.length,
                  total: results.keywords.length,
                })}
              </span>
              {(filters.search ||
                filters.keywordType !== "all" ||
                filters.minVolume ||
                filters.maxVolume ||
                filters.minDifficulty ||
                filters.maxDifficulty ||
                filters.minCpc ||
                filters.maxCpc ||
                filters.minPosition ||
                filters.maxPosition) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      keywordType: "all",
                      minVolume: "",
                      maxVolume: "",
                      minDifficulty: "",
                      maxDifficulty: "",
                      minCpc: "",
                      maxCpc: "",
                      minPosition: "",
                      maxPosition: "",
                      search: "",
                    })
                  }
                >
                  {tFilters("clearFilters")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Keywords Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              {t("keywordsList")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow>
                    <SortableHeader sortKey="keyword">
                      <div className="w-full min-w-[300px]">
                        {t("table.keyword")}
                      </div>
                    </SortableHeader>
                    <TableHead className="w-[100px] text-center">
                      Type
                    </TableHead>
                    <TableHead className="w-[120px] text-center">
                      Intention
                    </TableHead>
                    <SortableHeader sortKey="searchVolume">
                      <div className="w-full min-w-[100px] text-right">
                        Volume
                      </div>
                    </SortableHeader>
                    <SortableHeader sortKey="difficulty">
                      <div className="w-full min-w-[90px] text-right">
                        Difficulté
                      </div>
                    </SortableHeader>
                    <TableHead className="w-[100px] text-center">
                      Compétition
                    </TableHead>
                    <SortableHeader sortKey="cpc">
                      <div className="w-full min-w-[80px] text-right">CPC</div>
                    </SortableHeader>
                    <SortableHeader sortKey="position">
                      <div className="w-full min-w-[80px] text-right">
                        Position
                      </div>
                    </SortableHeader>
                    <TableHead className="w-[80px] text-center">URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedKeywords.map((keyword, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{keyword.keyword}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant={
                              keyword.type === "ranked"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              keyword.type === "ranked"
                                ? "bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400"
                                : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            }
                          >
                            {keyword.type === "ranked"
                              ? "Positionné"
                              : "Suggéré"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {keyword.intent && keyword.intent !== "unknown" && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              keyword.intent === "transactional"
                                ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : keyword.intent === "informational"
                                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                  : keyword.intent === "navigational"
                                    ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                                    : "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
                            }`}
                          >
                            {keyword.intent === "transactional"
                              ? "Commercial"
                              : keyword.intent === "informational"
                                ? "Informatif"
                                : keyword.intent === "navigational"
                                  ? "Navigation"
                                  : keyword.intent}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span>{formatNumber(keyword.searchVolume)}</span>
                          {keyword.trends && keyword.trends.monthly && (
                            <span
                              className={`text-xs ${
                                keyword.trends.monthly > 0
                                  ? "text-green-500"
                                  : keyword.trends.monthly < 0
                                    ? "text-red-500"
                                    : "text-gray-400"
                              }`}
                            >
                              {keyword.trends.monthly > 0
                                ? "↗"
                                : keyword.trends.monthly < 0
                                  ? "↘"
                                  : "→"}
                            </span>
                          )}
                        </div>
                        {keyword.monthlySearches &&
                          keyword.monthlySearches.length > 0 && (
                            <div className="mt-1 text-xs text-gray-500">
                              Avg:{" "}
                              {Math.round(
                                keyword.monthlySearches.reduce(
                                  (sum: number, m: any) =>
                                    sum + m.search_volume,
                                  0
                                ) / keyword.monthlySearches.length
                              )}
                            </div>
                          )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={getDifficultyColor(keyword.difficulty)}
                        >
                          {keyword.difficulty}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {keyword.competitionLevel &&
                        keyword.competitionLevel !== "UNKNOWN" ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              keyword.competitionLevel === "LOW"
                                ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : keyword.competitionLevel === "MEDIUM"
                                  ? "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                  : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                          >
                            {keyword.competitionLevel === "LOW"
                              ? "Faible"
                              : keyword.competitionLevel === "MEDIUM"
                                ? "Moyen"
                                : "Élevé"}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCPC(keyword.cpc, targetCountry)}
                      </TableCell>
                      <TableCell className="text-right">
                        {keyword.position ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          >
                            #{keyword.position}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {keyword.url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(keyword.url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {paginatedKeywords.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  {t("noResults")}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Affichage {(currentPage - 1) * itemsPerPage + 1} à{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredKeywords.length
                  )}{" "}
                  sur {filteredKeywords.length} résultats
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronUp className="mr-1 h-4 w-4 rotate-90" />
                    Précédent
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber
                      if (totalPages <= 5) {
                        pageNumber = i + 1
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i
                      } else {
                        pageNumber = currentPage - 2 + i
                      }
                      return (
                        <Button
                          key={pageNumber}
                          variant={
                            currentPage === pageNumber ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                    <ChevronDown className="ml-1 h-4 w-4 rotate-90" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
