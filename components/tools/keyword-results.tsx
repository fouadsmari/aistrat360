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

export function KeywordResults({ results, websiteName }: Props) {
  const t = useTranslations("tools.keywords.results")
  const tFilters = useTranslations("tools.keywords.filters")
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

    const topKeywords = [...results.keywords]
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 10)

    const opportunityKeywords = suggestions
      .filter((k) => k.searchVolume > 1000 && k.difficulty < 50)
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 5)

    return {
      totalVolume,
      avgPosition: Math.round(avgPosition * 10) / 10,
      topKeywords,
      opportunityKeywords,
      rankedKeywords: rankedKeywords.length,
      suggestions: suggestions.length,
    }
  }, [results.keywords])

  // Filter keywords
  const filteredKeywords = useMemo(() => {
    return results.keywords.filter((keyword) => {
      // Type filter
      if (filters.keywordType === "ranked" && keyword.type !== "ranked")
        return false
      if (
        filters.keywordType === "suggestions" &&
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

      return true
    })
  }, [results.keywords, filters])

  // Export to CSV
  const exportToCSV = () => {
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
      ...filteredKeywords.map((keyword) =>
        [
          `"${keyword.keyword}"`,
          keyword.type,
          keyword.searchVolume,
          keyword.difficulty,
          keyword.cpc.toFixed(2),
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

  return (
    <div className="space-y-6">
      {/* Header & Summary Stats */}
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-600">
                {results.totalKeywords}
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
              <div className="text-2xl font-bold text-green-600">
                {metrics.suggestions}
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

      {/* Filters */}
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
                <SelectContent className="border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  <SelectItem value="all">{tFilters("all")}</SelectItem>
                  <SelectItem value="ranked">{tFilters("ranked")}</SelectItem>
                  <SelectItem value="suggestions">
                    {tFilters("suggestions")}
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
                  placeholder="Min"
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
                  placeholder="Max"
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
              filters.maxDifficulty) && (
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.keyword")}</TableHead>
                  <TableHead>{t("table.type")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.volume")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("table.difficulty")}
                  </TableHead>
                  <TableHead className="text-right">{t("table.cpc")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.position")}
                  </TableHead>
                  <TableHead>{t("table.url")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeywords.map((keyword, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {keyword.keyword}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          keyword.type === "ranked" ? "default" : "secondary"
                        }
                        className={
                          keyword.type === "ranked"
                            ? "bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400"
                            : ""
                        }
                      >
                        {keyword.type === "ranked"
                          ? t("ranked")
                          : t("suggestion")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(keyword.searchVolume)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={getDifficultyColor(keyword.difficulty)}
                      >
                        {keyword.difficulty}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      €{keyword.cpc.toFixed(2)}
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
                    <TableCell>
                      {keyword.url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(keyword.url, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredKeywords.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                {t("noResults")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
