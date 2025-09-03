"use client"

import { useState, useMemo, useEffect } from "react"
import { useTranslations } from "next-intl"
import { formatCPC } from "@/lib/currency-utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronDown,
  ChevronUp,
  Globe,
  Search,
  Filter,
  ExternalLink,
  TrendingUp,
  DollarSign,
  BarChart3,
  Target,
  Hash,
  Download,
  Eye,
  Award,
  Clock,
  ArrowUpDown,
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

interface GroupedPage {
  url: string
  title: string
  keywords: DetailedKeyword[]
  totalKeywords: number
  avgSearchVolume: number
  totalSearchVolume: number
  avgCpc: number
  avgDifficulty: number
  avgPosition: number
  totalEtv: number
  bestPosition: number | null
  worstPosition: number | null
}

interface Props {
  analysisId: string
  websiteName: string
}

type SortField =
  | "totalKeywords"
  | "avgSearchVolume"
  | "totalSearchVolume"
  | "avgCpc"
  | "avgDifficulty"
  | "avgPosition"
  | "totalEtv"
type SortOrder = "asc" | "desc"

export function GroupedKeywordResults({ analysisId, websiteName }: Props) {
  const t = useTranslations("tools.keywords")
  const tResults = useTranslations("tools.keywords.results")
  const tGrouped = useTranslations("tools.keywords.grouped")
  const tCommon = useTranslations("common")

  const [data, setData] = useState<DetailedKeyword[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("totalKeywords")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [minVolume, setMinVolume] = useState("")
  const [maxVolume, setMaxVolume] = useState("")
  const [minDifficulty, setMinDifficulty] = useState("")
  const [maxDifficulty, setMaxDifficulty] = useState("")

  // Fetch detailed data
  useEffect(() => {
    const fetchDetailedData = async () => {
      try {
        const response = await fetch(
          `/api/tools/keywords/detailed/${analysisId}`
        )
        if (response.ok) {
          const result = await response.json()
          setData(result.rankedKeywords || [])
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

  // Group keywords by page URL
  const groupedPages = useMemo(() => {
    if (!data) return []

    const pageMap = new Map<string, GroupedPage>()
    const unrankedKeywords: DetailedKeyword[] = []

    data.forEach((keyword) => {
      // Skip keywords without URL (suggestions)
      if (!keyword.url) {
        unrankedKeywords.push(keyword)
        return
      }

      const pageUrl = keyword.url
      const pageTitle = keyword.title || pageUrl

      if (!pageMap.has(pageUrl)) {
        pageMap.set(pageUrl, {
          url: pageUrl,
          title: pageTitle,
          keywords: [],
          totalKeywords: 0,
          avgSearchVolume: 0,
          totalSearchVolume: 0,
          avgCpc: 0,
          avgDifficulty: 0,
          avgPosition: 0,
          totalEtv: 0,
          bestPosition: null,
          worstPosition: null,
        })
      }

      const page = pageMap.get(pageUrl)!
      page.keywords.push(keyword)
    })

    // Calculate aggregated metrics for each page
    pageMap.forEach((page) => {
      page.totalKeywords = page.keywords.length
      page.totalSearchVolume = page.keywords.reduce(
        (sum, k) => sum + k.searchVolume,
        0
      )
      page.avgSearchVolume = Math.round(
        page.totalSearchVolume / page.totalKeywords
      )
      page.avgCpc =
        page.keywords.reduce((sum, k) => sum + k.cpc, 0) / page.totalKeywords
      page.avgDifficulty =
        page.keywords.reduce((sum, k) => sum + k.difficulty, 0) /
        page.totalKeywords
      page.totalEtv = page.keywords.reduce((sum, k) => sum + k.etv, 0)

      const positionedKeywords = page.keywords.filter((k) => k.currentPosition)
      if (positionedKeywords.length > 0) {
        page.avgPosition =
          positionedKeywords.reduce(
            (sum, k) => sum + (k.currentPosition || 0),
            0
          ) / positionedKeywords.length
        page.bestPosition = Math.min(
          ...positionedKeywords.map((k) => k.currentPosition || 999)
        )
        page.worstPosition = Math.max(
          ...positionedKeywords.map((k) => k.currentPosition || 0)
        )
      }
    })

    // Add a special entry for unranked keywords if any
    if (unrankedKeywords.length > 0) {
      pageMap.set("__unranked__", {
        url: "__unranked__",
        title: tGrouped("unrankedKeywords"),
        keywords: unrankedKeywords,
        totalKeywords: unrankedKeywords.length,
        avgSearchVolume: Math.round(
          unrankedKeywords.reduce((sum, k) => sum + k.searchVolume, 0) /
            unrankedKeywords.length
        ),
        totalSearchVolume: unrankedKeywords.reduce(
          (sum, k) => sum + k.searchVolume,
          0
        ),
        avgCpc:
          unrankedKeywords.reduce((sum, k) => sum + k.cpc, 0) /
          unrankedKeywords.length,
        avgDifficulty:
          unrankedKeywords.reduce((sum, k) => sum + k.difficulty, 0) /
          unrankedKeywords.length,
        avgPosition: 0,
        totalEtv: 0,
        bestPosition: null,
        worstPosition: null,
      })
    }

    return Array.from(pageMap.values())
  }, [data, tGrouped])

  // Apply filters and sorting
  const filteredAndSortedPages = useMemo(() => {
    let filtered = [...groupedPages]

    // Apply search filter
    if (search) {
      filtered = filtered.filter(
        (page) =>
          page.url.toLowerCase().includes(search.toLowerCase()) ||
          page.title.toLowerCase().includes(search.toLowerCase()) ||
          page.keywords.some((k) =>
            k.keyword.toLowerCase().includes(search.toLowerCase())
          )
      )
    }

    // Apply volume filters
    if (minVolume) {
      const min = parseInt(minVolume)
      filtered = filtered.filter((page) => page.avgSearchVolume >= min)
    }
    if (maxVolume) {
      const max = parseInt(maxVolume)
      filtered = filtered.filter((page) => page.avgSearchVolume <= max)
    }

    // Apply difficulty filters
    if (minDifficulty) {
      const min = parseInt(minDifficulty)
      filtered = filtered.filter((page) => page.avgDifficulty >= min)
    }
    if (maxDifficulty) {
      const max = parseInt(maxDifficulty)
      filtered = filtered.filter((page) => page.avgDifficulty <= max)
    }

    // Sort pages
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [
    groupedPages,
    search,
    minVolume,
    maxVolume,
    minDifficulty,
    maxDifficulty,
    sortField,
    sortOrder,
  ])

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Page URL",
      "Page Title",
      "Keyword",
      "Search Volume",
      "Difficulty",
      "CPC",
      "Position",
      "ETV",
    ]

    const rows: string[][] = []
    filteredAndSortedPages.forEach((page) => {
      page.keywords.forEach((keyword) => {
        rows.push([
          page.url,
          page.title,
          keyword.keyword,
          keyword.searchVolume.toString(),
          keyword.difficulty.toString(),
          formatCPC(keyword.cpc, "FR"),
          keyword.currentPosition?.toString() || "",
          keyword.etv.toFixed(2),
        ])
      })
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `grouped-keywords-${websiteName}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return "text-green-600"
    if (difficulty <= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getIntentBadge = (intent: string) => {
    const badgeClasses = {
      transactional:
        "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700",
      informational:
        "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700",
      navigational:
        "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700",
      default:
        "bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700",
    }
    const badgeTexts = {
      transactional: "Commercial",
      informational: "Informationnel",
      navigational: "Navigationnel",
    }
    return {
      className:
        badgeClasses[intent as keyof typeof badgeClasses] ||
        badgeClasses.default,
      text: badgeTexts[intent as keyof typeof badgeTexts] || intent,
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-violet-600"></div>
        <span className="ml-2">{tCommon("loading")}</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="py-8 text-center text-gray-500">{tGrouped("noData")}</div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-violet-600" />
                {tGrouped("title")}
              </CardTitle>
              <CardDescription>
                {tGrouped("description", { websiteName })}
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {tCommon("export")} CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-violet-50 p-4 text-center dark:bg-violet-900/20">
              <div className="text-2xl font-bold text-violet-600">
                {filteredAndSortedPages.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {tGrouped("totalPages")}
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
              <div className="text-2xl font-bold text-blue-600">
                {filteredAndSortedPages.reduce(
                  (sum, p) => sum + p.totalKeywords,
                  0
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {tGrouped("totalKeywords")}
              </div>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(
                  filteredAndSortedPages.reduce(
                    (sum, p) => sum + p.totalSearchVolume,
                    0
                  )
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {tGrouped("totalVolume")}
              </div>
            </div>
            <div className="rounded-lg bg-orange-50 p-4 text-center dark:bg-orange-900/20">
              <div className="text-2xl font-bold text-orange-600">
                €
                {filteredAndSortedPages
                  .reduce((sum, p) => sum + p.totalEtv, 0)
                  .toFixed(0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {tGrouped("totalValue")}
              </div>
            </div>
          </div>

          {/* Filters and Sorting */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>{tGrouped("searchPages")}</Label>
                <Input
                  placeholder={tGrouped("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>{tGrouped("sortBy")}</Label>
                <Select
                  value={`${sortField}-${sortOrder}`}
                  onValueChange={(value) => {
                    const [field, order] = value.split("-") as [
                      SortField,
                      SortOrder,
                    ]
                    setSortField(field)
                    setSortOrder(order)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <SelectItem value="totalKeywords-desc">
                      {tGrouped("sortByKeywordsDesc")}
                    </SelectItem>
                    <SelectItem value="totalKeywords-asc">
                      {tGrouped("sortByKeywordsAsc")}
                    </SelectItem>
                    <SelectItem value="avgSearchVolume-desc">
                      {tGrouped("sortByVolumeDesc")}
                    </SelectItem>
                    <SelectItem value="avgSearchVolume-asc">
                      {tGrouped("sortByVolumeAsc")}
                    </SelectItem>
                    <SelectItem value="avgCpc-desc">
                      {tGrouped("sortByCpcDesc")}
                    </SelectItem>
                    <SelectItem value="avgCpc-asc">
                      {tGrouped("sortByCpcAsc")}
                    </SelectItem>
                    <SelectItem value="avgDifficulty-desc">
                      {tGrouped("sortByDifficultyDesc")}
                    </SelectItem>
                    <SelectItem value="avgDifficulty-asc">
                      {tGrouped("sortByDifficultyAsc")}
                    </SelectItem>
                    <SelectItem value="avgPosition-asc">
                      {tGrouped("sortByPositionAsc")}
                    </SelectItem>
                    <SelectItem value="avgPosition-desc">
                      {tGrouped("sortByPositionDesc")}
                    </SelectItem>
                    <SelectItem value="totalEtv-desc">
                      {tGrouped("sortByValueDesc")}
                    </SelectItem>
                    <SelectItem value="totalEtv-asc">
                      {tGrouped("sortByValueAsc")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{tGrouped("volumeRange")}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={minVolume}
                    onChange={(e) => setMinVolume(e.target.value)}
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={maxVolume}
                    onChange={(e) => setMaxVolume(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Active filters count */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {tGrouped("showingPages", {
                  count: filteredAndSortedPages.length,
                  total: groupedPages.length,
                })}
              </span>
              {(search ||
                minVolume ||
                maxVolume ||
                minDifficulty ||
                maxDifficulty) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("")
                    setMinVolume("")
                    setMaxVolume("")
                    setMinDifficulty("")
                    setMaxDifficulty("")
                  }}
                >
                  {tGrouped("clearFilters")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards with pages and keywords */}
      <div className="space-y-4">
        {filteredAndSortedPages.map((page, index) => (
          <Card
            key={page.url}
            className="border border-gray-200 dark:border-gray-700"
          >
            <CardHeader
              className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => {
                const newExpanded = [...expandedItems]
                const itemIndex = newExpanded.indexOf(page.url)
                if (itemIndex >= 0) {
                  newExpanded.splice(itemIndex, 1)
                } else {
                  newExpanded.push(page.url)
                }
                setExpandedItems(newExpanded)
              }}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <div className="flex items-center gap-2 text-base font-medium">
                      {page.url === "__unranked__" ? (
                        <Target className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Globe className="h-4 w-4 text-violet-600" />
                      )}
                      <span className="max-w-md truncate">{page.title}</span>
                    </div>
                    {page.url !== "__unranked__" && (
                      <div className="mt-1 max-w-md truncate text-xs text-gray-500">
                        {page.url}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
                    <div className="text-center">
                      <div className="font-semibold text-violet-600">
                        {page.totalKeywords}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tGrouped("keywords")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">
                        {formatNumber(page.avgSearchVolume)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tGrouped("avgVolume")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">
                        €{page.avgCpc.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tGrouped("avgCpc")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-semibold ${getDifficultyColor(page.avgDifficulty)}`}
                      >
                        {Math.round(page.avgDifficulty)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {tGrouped("avgDifficulty")}
                      </div>
                    </div>
                    {page.avgPosition > 0 && (
                      <div className="text-center">
                        <div className="font-semibold text-green-600">
                          #{Math.round(page.avgPosition)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {tGrouped("avgPosition")}
                        </div>
                      </div>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      expandedItems.includes(page.url)
                        ? "rotate-180 transform"
                        : ""
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
            {expandedItems.includes(page.url) && (
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tResults("table.keyword")}</TableHead>
                        <TableHead className="text-right">
                          {tResults("table.volume")}
                        </TableHead>
                        <TableHead className="text-right">
                          {tResults("table.difficulty")}
                        </TableHead>
                        <TableHead className="text-right">
                          {tResults("table.cpc")}
                        </TableHead>
                        <TableHead className="text-right">ETV (€)</TableHead>
                        <TableHead className="text-right">
                          {tResults("table.position")}
                        </TableHead>
                        <TableHead className="text-center">Intent</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {page.keywords
                        .sort((a, b) => b.searchVolume - a.searchVolume)
                        .map((keyword, kIndex) => (
                          <TableRow key={`${page.url}-${kIndex}`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span>{keyword.keyword}</span>
                                {keyword.isNew && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-100 text-xs text-blue-800"
                                  >
                                    NEW
                                  </Badge>
                                )}
                                {keyword.isUp && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-xs text-green-800"
                                  >
                                    ↑
                                  </Badge>
                                )}
                                {keyword.isDown && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-red-100 text-xs text-red-800"
                                  >
                                    ↓
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(keyword.searchVolume)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className={`${getDifficultyColor(keyword.difficulty)}`}
                              >
                                {keyword.difficulty}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              €{keyword.cpc.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {keyword.etv ? (
                                <span className="font-medium text-green-600">
                                  €{keyword.etv.toFixed(2)}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {keyword.currentPosition ? (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                >
                                  #{keyword.currentPosition}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {keyword.intent &&
                                keyword.intent !== "unknown" && (
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getIntentBadge(keyword.intent).className}`}
                                  >
                                    {getIntentBadge(keyword.intent).text}
                                  </Badge>
                                )}
                            </TableCell>
                            <TableCell>
                              {keyword.url && page.url !== "__unranked__" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    window.open(keyword.url!, "_blank")
                                  }
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

                {/* Page Actions */}
                {page.url !== "__unranked__" && (
                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span>
                          {tGrouped("bestPosition")}:
                          <strong className="ml-1 text-green-600">
                            {page.bestPosition
                              ? `#${page.bestPosition}`
                              : "N/A"}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <span>
                          {tGrouped("totalValue")}:
                          <strong className="ml-1 text-blue-600">
                            €{page.totalEtv.toFixed(2)}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(page.url, "_blank")}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {tGrouped("visitPage")}
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}

        {filteredAndSortedPages.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              {tGrouped("noResults")}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
