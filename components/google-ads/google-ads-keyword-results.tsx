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
  Search,
  Filter,
  ExternalLink,
  Hash,
  Award,
  ChevronUp,
  ChevronDown,
} from "lucide-react"

interface KeywordData {
  keyword: string
  type: "ranked" | "suggestion"
  searchVolume: number
  difficulty: number
  cpc: number
  competition?: number
  competitionLevel?: string
  position?: number
  url?: string
  intent?: string
  trends?: any
  monthlySearches?: any[]
}

interface GoogleAdsKeywordResultsProps {
  results: {
    keywords: KeywordData[]
    totalKeywords: number
    rankedKeywords: number
    opportunities: number
  }
  hideEnhancedResults?: boolean
  targetCountry: string
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

export function GoogleAdsKeywordResults({
  results,
  hideEnhancedResults = false,
  targetCountry,
}: GoogleAdsKeywordResultsProps) {
  const t = useTranslations("googleAds.results")
  const tTable = useTranslations("googleAds.results.table")
  const tFilters = useTranslations("googleAds.results.filters")

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

  // Metrics calculations optimisées pour Google Ads
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

    // Calcul des opportunités pour Google Ads : focus sur le potentiel publicitaire
    const adOpportunities = keywordIdeas
      .filter((k) => k.searchVolume > 100 && k.cpc > 0.5 && k.difficulty < 70)
      .sort((a, b) => {
        // Score d'opportunité basé sur volume * CPC / difficulté
        const scoreA = (a.searchVolume * a.cpc) / Math.max(a.difficulty, 1)
        const scoreB = (b.searchVolume * b.cpc) / Math.max(b.difficulty, 1)
        return scoreB - scoreA
      })

    return {
      totalVolume,
      avgPosition: Math.round(avgPosition * 10) / 10,
      topKeywords,
      adOpportunities,
      rankedKeywords: rankedKeywords.length,
      keywordIdeas: keywordIdeas.length,
      opportunities: adOpportunities.length,
      avgCpc:
        results.keywords.reduce((sum, k) => sum + k.cpc, 0) /
          results.keywords.length || 0,
    }
  }, [results.keywords])

  // Helper function to get sortable value
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
        return keyword.position || 999
      default:
        return ""
    }
  }

  // Filter and sort keywords
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

      // CPC filters (important pour Google Ads)
      if (filters.minCpc) {
        const min = parseFloat(filters.minCpc)
        if (keyword.cpc < min) return false
      }
      if (filters.maxCpc) {
        const max = parseFloat(filters.maxCpc)
        if (keyword.cpc > max) return false
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
  const totalPages = Math.ceil(filteredKeywords.length / itemsPerPage)
  const paginatedKeywords = filteredKeywords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const SortableHeader = ({
    sortKey,
    children,
  }: {
    sortKey: string
    children: React.ReactNode
  }) => (
    <TableHead>
      <button
        onClick={() => handleSort(sortKey)}
        className="flex w-full items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        {children}
        {sortConfig?.key === sortKey && (
          <>
            {sortConfig.direction === "asc" ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </>
        )}
      </button>
    </TableHead>
  )

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30)
      return "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400"
    if (difficulty < 60)
      return "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
    return "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400"
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k"
    }
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Métriques spécifiques Google Ads */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {t("googleAdsMetrics")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {metrics.keywordIdeas}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t("adOpportunities")}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCPC(metrics.avgCpc, targetCountry)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t("avgCpc")}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatNumber(metrics.totalVolume)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t("totalVolume")}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {metrics.opportunities}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t("highPotentialKeywords")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres simplifiés pour Google Ads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {tFilters("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <SelectContent>
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
              <Label>CPC Min ({getCurrencySymbol(targetCountry)})</Label>
              <Input
                placeholder="0.50"
                type="number"
                step="0.01"
                value={filters.minCpc}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, minCpc: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Résultats filtrés */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t("showingResults", {
                count: filteredKeywords.length,
                total: results.keywords.length,
              })}
            </span>
            {Object.values(filters).some((v) => v !== "" && v !== "all") && (
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

      {/* Table des mots-clés optimisée pour Google Ads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {t("keywordsList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader sortKey="keyword">
                    {tTable("keyword")}
                  </SortableHeader>
                  <TableHead>Type</TableHead>
                  <SortableHeader sortKey="searchVolume">Volume</SortableHeader>
                  <SortableHeader sortKey="cpc">CPC</SortableHeader>
                  <SortableHeader sortKey="difficulty">
                    Difficulté
                  </SortableHeader>
                  <TableHead>Compétition</TableHead>
                  <SortableHeader sortKey="position">Position</SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedKeywords.map((keyword, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {keyword.keyword}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          keyword.type === "ranked" ? "default" : "secondary"
                        }
                      >
                        {keyword.type === "ranked"
                          ? "Positionné"
                          : "Opportunité"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(keyword.searchVolume)}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCPC(keyword.cpc, targetCountry)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getDifficultyColor(keyword.difficulty)}
                      >
                        {keyword.difficulty}%
                      </Badge>
                    </TableCell>
                    <TableCell>{keyword.competitionLevel || "-"}</TableCell>
                    <TableCell>
                      {keyword.position ? (
                        <Badge variant="outline">#{keyword.position}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} sur {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
