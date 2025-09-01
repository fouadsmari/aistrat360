"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "lucide-react"

interface KeywordData {
  keyword: string
  type: "ranked" | "suggestion"
  searchVolume: number
  difficulty: number
  cpc: number
  position?: number
  url?: string
}

interface AnalysisResults {
  id: string
  totalKeywords: number
  rankedKeywords: number
  opportunities: number
  cost: number
  keywords: KeywordData[]
}

interface Props {
  results: AnalysisResults
  websiteName: string
}

interface Filters {
  keywordType: "all" | "ranked" | "suggestions"
  minVolume: string
  maxVolume: string
  minDifficulty: string
  maxDifficulty: string
  search: string
}

export function DataForSEOResults({ results, websiteName }: Props) {
  const t = useTranslations("tools.dataforseo.results")
  const tFilters = useTranslations("tools.dataforseo.filters")
  const tCommon = useTranslations("common")

  const [filters, setFilters] = useState<Filters>({
    keywordType: "all",
    minVolume: "",
    maxVolume: "",
    minDifficulty: "",
    maxDifficulty: "",
    search: "",
  })

  // Metrics calculations
  const metrics = useMemo(() => {
    const rankedKeywords = results.keywords.filter((k) => k.type === "ranked")
    const suggestions = results.keywords.filter((k) => k.type === "suggestion")

    const totalVolume = results.keywords.reduce(
      (sum, k) => sum + k.searchVolume,
      0
    )
    const avgPosition =
      rankedKeywords.length > 0
        ? rankedKeywords.reduce((sum, k) => sum + (k.position || 0), 0) /
          rankedKeywords.length
        : 0
    const avgCpc =
      results.keywords.length > 0
        ? results.keywords.reduce((sum, k) => sum + k.cpc, 0) /
          results.keywords.length
        : 0

    return {
      totalVolume,
      avgPosition: Math.round(avgPosition * 10) / 10,
      avgCpc: Math.round(avgCpc * 100) / 100,
      rankedCount: rankedKeywords.length,
      suggestionsCount: suggestions.length,
    }
  }, [results.keywords])

  // Filtered keywords
  const filteredKeywords = useMemo(() => {
    let filtered = [...results.keywords]

    // Type filter
    if (filters.keywordType !== "all") {
      filtered = filtered.filter((k) =>
        filters.keywordType === "ranked"
          ? k.type === "ranked"
          : k.type === "suggestion"
      )
    }

    // Volume filters
    if (filters.minVolume) {
      const min = parseInt(filters.minVolume)
      if (!isNaN(min)) {
        filtered = filtered.filter((k) => k.searchVolume >= min)
      }
    }
    if (filters.maxVolume) {
      const max = parseInt(filters.maxVolume)
      if (!isNaN(max)) {
        filtered = filtered.filter((k) => k.searchVolume <= max)
      }
    }

    // Difficulty filters
    if (filters.minDifficulty) {
      const min = parseInt(filters.minDifficulty)
      if (!isNaN(min)) {
        filtered = filtered.filter((k) => k.difficulty >= min)
      }
    }
    if (filters.maxDifficulty) {
      const max = parseInt(filters.maxDifficulty)
      if (!isNaN(max)) {
        filtered = filtered.filter((k) => k.difficulty <= max)
      }
    }

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter((k) =>
        k.keyword.toLowerCase().includes(search)
      )
    }

    // Sort by search volume descending
    return filtered.sort((a, b) => b.searchVolume - a.searchVolume)
  }, [results.keywords, filters])

  // Export to CSV
  const exportToCsv = () => {
    const headers = [
      "Keyword",
      "Type",
      "Search Volume",
      "Difficulty",
      "CPC",
      "Position",
      "URL",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredKeywords.map((k) =>
        [
          `"${k.keyword}"`,
          k.type,
          k.searchVolume,
          k.difficulty,
          k.cpc,
          k.position || "",
          k.url || "",
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `dataforseo-analysis-${websiteName}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      keywordType: "all",
      minVolume: "",
      maxVolume: "",
      minDifficulty: "",
      maxDifficulty: "",
      search: "",
    })
  }

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30)
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    if (difficulty < 60)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
    return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
  }

  // Get position badge color
  const getPositionColor = (position: number) => {
    if (position <= 3)
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    if (position <= 10)
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    if (position <= 20)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
  }

  return (
    <div className="space-y-6">
      {/* Results Header & Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>{t("title")}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {websiteName} • {t("cost")}: ${results.cost.toFixed(4)}
                </p>
              </div>
            </div>
            <Button onClick={exportToCsv} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t("exportCsv")}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800/50">
              <Hash className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {results.totalKeywords.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("totalKeywords")}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800/50">
              <Award className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.rankedCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("rankedKeywords")}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800/50">
              <TrendingUp className="mx-auto mb-2 h-8 w-8 text-yellow-600" />
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.suggestionsCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("opportunities")}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800/50">
              <Target className="mx-auto mb-2 h-8 w-8 text-purple-600" />
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.avgPosition || "—"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("avgPosition")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <span className="font-medium">Filters</span>
            </div>
            <Button onClick={resetFilters} variant="ghost" size="sm">
              Clear filters
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <Label htmlFor="search">{tCommon("search")}</Label>
              <Input
                id="search"
                placeholder="Search keywords..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="type">{tFilters("keywordType")}</Label>
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
                  <SelectItem value="all">{tFilters("allTypes")}</SelectItem>
                  <SelectItem value="ranked">{tFilters("ranked")}</SelectItem>
                  <SelectItem value="suggestions">
                    {tFilters("suggestions")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="minVolume">{tFilters("minVolume")}</Label>
              <Input
                id="minVolume"
                type="number"
                placeholder="0"
                value={filters.minVolume}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, minVolume: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="maxVolume">{tFilters("maxVolume")}</Label>
              <Input
                id="maxVolume"
                type="number"
                placeholder="999999"
                value={filters.maxVolume}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, maxVolume: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="difficulty">
                {tFilters("difficulty")} (0-100)
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minDifficulty}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minDifficulty: e.target.value,
                    }))
                  }
                />
                <Input
                  type="number"
                  placeholder="100"
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
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Keywords ({filteredKeywords.length.toLocaleString()})
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          {filteredKeywords.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {t("noResults")}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("keyword")}</TableHead>
                    <TableHead>{t("type")}</TableHead>
                    <TableHead className="text-right">
                      {t("searchVolume")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("difficulty")}
                    </TableHead>
                    <TableHead className="text-right">{t("cpc")}</TableHead>
                    <TableHead className="text-right">
                      {t("position")}
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeywords.map((keyword, index) => (
                    <TableRow key={`${keyword.keyword}-${index}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-gray-400" />
                          {keyword.keyword}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            keyword.type === "ranked" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {keyword.type === "ranked"
                            ? tFilters("ranked")
                            : tFilters("suggestions")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {keyword.searchVolume.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={getDifficultyColor(keyword.difficulty)}
                          variant="secondary"
                        >
                          {keyword.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${keyword.cpc.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {keyword.position ? (
                          <Badge
                            className={getPositionColor(keyword.position)}
                            variant="secondary"
                          >
                            #{keyword.position}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {keyword.url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(keyword.url, "_blank")}
                            className="h-8 w-8 p-0"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
