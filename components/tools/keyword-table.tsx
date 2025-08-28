"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart3,
  DollarSign,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react"

interface KeywordData {
  keyword: string
  searchVolume: number
  cpc: number
  difficulty: number
}

interface KeywordTableProps {
  keywords: KeywordData[]
  currencySymbol: string
  targetCountry: string
}

type SortField = "keyword" | "searchVolume" | "cpc" | "difficulty" | "roiScore"
type SortDirection = "asc" | "desc" | null

export function KeywordTable({ keywords, currencySymbol, targetCountry }: KeywordTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [volumeFilter, setVolumeFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Calculate enhanced keyword data
  const enhancedKeywords = useMemo(() => {
    return keywords.map(kw => ({
      ...kw,
      roiScore: kw.searchVolume && kw.cpc ? Math.round(kw.searchVolume / kw.cpc / 10) : 0,
      difficultyLevel: kw.difficulty < 0.3 ? "Faible" : kw.difficulty < 0.7 ? "Moyen" : "Élevé",
      difficultyColor: kw.difficulty < 0.3 ? "text-green-600" : kw.difficulty < 0.7 ? "text-orange-600" : "text-red-600",
    }))
  }, [keywords])

  // Filter and sort data
  const filteredAndSortedKeywords = useMemo(() => {
    let filtered = enhancedKeywords.filter(kw => {
      // Search filter
      if (searchTerm && !kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Difficulty filter
      if (difficultyFilter !== "all") {
        if (difficultyFilter === "low" && kw.difficulty >= 0.3) return false
        if (difficultyFilter === "medium" && (kw.difficulty < 0.3 || kw.difficulty >= 0.7)) return false
        if (difficultyFilter === "high" && kw.difficulty < 0.7) return false
      }

      // Volume filter
      if (volumeFilter !== "all") {
        if (volumeFilter === "low" && kw.searchVolume >= 1000) return false
        if (volumeFilter === "medium" && (kw.searchVolume < 1000 || kw.searchVolume >= 10000)) return false
        if (volumeFilter === "high" && kw.searchVolume < 10000) return false
      }

      return true
    })

    // Sort data
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortField]
        let bValue: any = b[sortField]

        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
    }

    return filtered
  }, [enhancedKeywords, searchTerm, difficultyFilter, volumeFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => 
        prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
      )
      if (sortDirection === "desc") {
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-30" />
    if (sortDirection === "asc") return <ArrowUp className="h-4 w-4 text-violet-600" />
    if (sortDirection === "desc") return <ArrowDown className="h-4 w-4 text-violet-600" />
    return <ArrowUpDown className="h-4 w-4 opacity-30" />
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Rechercher un mot-clé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Difficulté" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="high">Élevée</SelectItem>
          </SelectContent>
        </Select>

        <Select value={volumeFilter} onValueChange={setVolumeFilter}>
          <SelectTrigger className="w-40">
            <BarChart3 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Volume" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous volumes</SelectItem>
            <SelectItem value="low">0-1K</SelectItem>
            <SelectItem value="medium">1K-10K</SelectItem>
            <SelectItem value="high">10K+</SelectItem>
          </SelectContent>
        </Select>

        {(searchTerm || difficultyFilter !== "all" || volumeFilter !== "all") && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSearchTerm("")
              setDifficultyFilter("all")
              setVolumeFilter("all")
            }}
          >
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>
            {filteredAndSortedKeywords.length} mots-clés affichés sur {keywords.length} total pour le marché {targetCountry}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("keyword")}
                >
                  Mot-clé
                  {getSortIcon("keyword")}
                </Button>
              </TableHead>
              <TableHead className="text-right font-semibold">
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("searchVolume")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <BarChart3 className="h-4 w-4" />
                    Volume/mois
                    {getSortIcon("searchVolume")}
                  </div>
                </Button>
              </TableHead>
              <TableHead className="text-right font-semibold">
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("cpc")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <DollarSign className="h-4 w-4" />
                    CPC
                    {getSortIcon("cpc")}
                  </div>
                </Button>
              </TableHead>
              <TableHead className="text-right font-semibold">
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("difficulty")}
                >
                  Difficulté
                  {getSortIcon("difficulty")}
                </Button>
              </TableHead>
              <TableHead className="text-right font-semibold">
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("roiScore")}
                >
                  Score ROI
                  {getSortIcon("roiScore")}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedKeywords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Aucun mot-clé ne correspond aux filtres sélectionnés
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedKeywords.map((kw, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    <div className="max-w-xs">{kw.keyword}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold">
                      {(kw.searchVolume || 0).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold">
                      {currencySymbol}
                      {(kw.cpc || 0).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={`${kw.difficultyColor} border-current`}
                    >
                      {kw.difficultyLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-12 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                          style={{
                            width: `${Math.min(100, kw.roiScore)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {kw.roiScore}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Keywords Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-violet-50 p-4 text-center dark:bg-violet-900/10">
          <div className="text-2xl font-bold text-violet-600">
            {filteredAndSortedKeywords
              .reduce(
                (sum, kw) => sum + (kw.searchVolume || 0),
                0
              )
              .toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Volume total/mois
          </div>
        </div>
        <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/10">
          <div className="text-2xl font-bold text-green-600">
            {currencySymbol}
            {filteredAndSortedKeywords.length > 0 ? (
              filteredAndSortedKeywords.reduce(
                (sum, kw) => sum + (kw.cpc || 0),
                0
              ) / filteredAndSortedKeywords.length
            ).toFixed(2) : "0.00"}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            CPC moyen
          </div>
        </div>
        <div className="rounded-lg bg-orange-50 p-4 text-center dark:bg-orange-900/10">
          <div className="text-2xl font-bold text-orange-600">
            {filteredAndSortedKeywords.length > 0 ? Math.round(
              (filteredAndSortedKeywords.filter(
                (kw) => kw.difficulty < 0.5
              ).length /
                filteredAndSortedKeywords.length) *
                100
            ) : 0}
            %
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Mots-clés accessibles
          </div>
        </div>
      </div>
    </div>
  )
}