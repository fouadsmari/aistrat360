"use client"

import { useState, useMemo, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import {
  TrendingUp, TrendingDown, Eye, ExternalLink, Award, Crown, Target,
  Calendar, DollarSign, BarChart3, Zap, AlertCircle, CheckCircle,
  ArrowUp, ArrowDown, Minus, ChevronDown, ChevronUp, Users, Globe,
  Search, Hash, Clock, Activity, Shield, Star
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
  monthlySearches: Array<{ year: number, month: number, search_volume: number }>
  trends: { yearly: number, monthly: number, quarterly: number }
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

interface Competitor {
  domain: string
  websiteName: string
  appearances: number
  avgPosition: number
  totalEtv: number
  backlinks: any
  keywords: Array<{ keyword: string, position: number, etv: number }>
}

interface EnhancedAnalysisData {
  id: string
  website: { name: string, url: string }
  rankedKeywords: DetailedKeyword[]
  suggestions: DetailedKeyword[]
  competitors: Competitor[]
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
  const [data, setData] = useState<EnhancedAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedKeyword, setSelectedKeyword] = useState<DetailedKeyword | null>(null)
  const [showKeywordModal, setShowKeywordModal] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch enhanced data
  useEffect(() => {
    const fetchDetailedData = async () => {
      try {
        const response = await fetch(`/api/tools/keywords/detailed/${analysisId}`)
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
    
    return selectedKeyword.monthlySearches.map(item => ({
      month: `${item.year}-${item.month.toString().padStart(2, '0')}`,
      volume: item.search_volume,
      monthName: new Date(item.year, item.month - 1).toLocaleDateString('fr-FR', { month: 'short' })
    })).reverse()
  }, [selectedKeyword])

  const competitionDistribution = useMemo(() => {
    if (!data?.rankedKeywords) return []
    
    const levels = { LOW: 0, MEDIUM: 0, HIGH: 0, UNKNOWN: 0 }
    data.rankedKeywords.forEach(kw => {
      levels[kw.competitionLevel as keyof typeof levels] += 1
    })
    
    return Object.entries(levels).map(([level, count]) => ({
      name: level,
      value: count,
      color: level === 'LOW' ? '#10b981' : level === 'MEDIUM' ? '#f59e0b' : level === 'HIGH' ? '#ef4444' : '#6b7280'
    }))
  }, [data])

  const intentDistribution = useMemo(() => {
    if (!data?.rankedKeywords) return []
    
    const intents: { [key: string]: number } = {}
    data.rankedKeywords.forEach(kw => {
      intents[kw.intent] = (intents[kw.intent] || 0) + 1
    })
    
    return Object.entries(intents).map(([intent, count]) => ({
      intent,
      count,
      percentage: Math.round((count / data.rankedKeywords.length) * 100)
    }))
  }, [data])

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'transactional': return <DollarSign className="h-4 w-4 text-green-500" />
      case 'informational': return <Search className="h-4 w-4 text-blue-500" />
      case 'navigational': return <Globe className="h-4 w-4 text-purple-500" />
      default: return <Hash className="h-4 w-4 text-gray-500" />
    }
  }

  const getPositionTrend = (keyword: DetailedKeyword) => {
    if (keyword.isNew) return <Badge className="bg-blue-500"><Star className="h-3 w-3 mr-1" />New</Badge>
    if (keyword.isUp) return <Badge className="bg-green-500"><ArrowUp className="h-3 w-3 mr-1" />↑</Badge>
    if (keyword.isDown) return <Badge className="bg-red-500"><ArrowDown className="h-3 w-3 mr-1" />↓</Badge>
    return <Badge variant="outline"><Minus className="h-3 w-3 mr-1" />-</Badge>
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return 'text-green-600'
    if (difficulty <= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement des données avancées...</span>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">Aucune donnée disponible</div>
  }

  return (
    <div className="space-y-6">
      {/* Hero Dashboard */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Analyse Complète - {websiteName}
          </CardTitle>
          <CardDescription>
            Données enrichies de {data.rankedKeywords.length} mots-clés avec insights concurrentiels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.summary.avgSearchVolume.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Volume Moyen</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600">#{data.summary.avgPosition}</div>
              <div className="text-sm text-gray-500">Position Moy.</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">€{data.summary.avgCpc.toFixed(2)}</div>
              <div className="text-sm text-gray-500">CPC Moyen</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">€{data.summary.totalEtv.toFixed(0)}</div>
              <div className="text-sm text-gray-500">Valeur Trafic</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{data.competitors.length}</div>
              <div className="text-sm text-gray-500">Concurrents</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">📊 Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="keywords">🔍 Mots-clés</TabsTrigger>
          <TabsTrigger value="competitors">👥 Concurrents</TabsTrigger>
          <TabsTrigger value="insights">💡 Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competition Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Distribution de la Concurrence
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
                <div className="flex flex-wrap gap-2 mt-4">
                  {competitionDistribution.map((item) => (
                    <Badge key={item.name} variant="outline" className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      {item.name}: {item.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Intent Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Analyse d&apos;Intention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {intentDistribution.map((item) => (
                    <div key={item.intent} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getIntentIcon(item.intent)}
                        <span className="capitalize">{item.intent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={item.percentage} className="w-20" />
                        <span className="text-sm font-medium">{item.percentage}%</span>
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
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openKeywordModal(keyword)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-blue-600">
                        {keyword.keyword}
                      </div>
                      {getPositionTrend(keyword)}
                      {getIntentIcon(keyword.intent)}
                    </div>
                    <div className="flex items-center gap-2">
                      {keyword.currentPosition && (
                        <Badge variant="outline">#{keyword.currentPosition}</Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Volume</div>
                      <div className="font-medium">{keyword.searchVolume.toLocaleString()}/mois</div>
                    </div>
                    <div>
                      <div className="text-gray-500">CPC</div>
                      <div className="font-medium">€{keyword.cpc.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Difficulté</div>
                      <div className={`font-medium ${getDifficultyColor(keyword.difficulty)}`}>
                        {keyword.difficulty > 0 ? `${keyword.difficulty}%` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Valeur</div>
                      <div className="font-medium text-green-600">€{keyword.etv.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  {keyword.description && (
                    <div className="mt-3 text-sm text-gray-600 truncate">
                      {keyword.description}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <div className="grid gap-4">
            {data.competitors.map((competitor, index) => (
              <Card key={competitor.domain}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-gradient-to-r from-red-500 to-orange-500">
                        #{index + 1}
                      </Badge>
                      <div>
                        <div className="font-semibold">{competitor.websiteName}</div>
                        <div className="text-sm text-gray-500">{competitor.domain}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Visiter
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{competitor.appearances}</div>
                      <div className="text-sm text-gray-600">Mots-clés</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">#{competitor.avgPosition}</div>
                      <div className="text-sm text-gray-600">Position Moy.</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">€{competitor.totalEtv}</div>
                      <div className="text-sm text-gray-600">Valeur ETV</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-xl font-bold text-orange-600">
                        {competitor.backlinks?.backlinks || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Backlinks</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Top mots-clés concurrentiels:</div>
                    <div className="flex flex-wrap gap-2">
                      {competitor.keywords.slice(0, 8).map((kw) => (
                        <Badge key={kw.keyword} variant="secondary" className="text-xs">
                          {kw.keyword} (#{kw.position})
                        </Badge>
                      ))}
                      {competitor.keywords.length > 8 && (
                        <Badge variant="outline" className="text-xs">
                          +{competitor.keywords.length - 8} autres
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            <Card className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Opportunités Rapides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.rankedKeywords
                    .filter(kw => kw.competitionLevel === 'LOW' && kw.searchVolume > 500)
                    .slice(0, 5)
                    .map((kw) => (
                      <div key={kw.keyword} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <div className="font-medium">{kw.keyword}</div>
                          <div className="text-sm text-gray-500">
                            {kw.searchVolume.toLocaleString()} recherches • Faible concurrence
                          </div>
                        </div>
                        <Badge className="bg-green-500">Opportunité</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Positions à Améliorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.rankedKeywords
                    .filter(kw => kw.currentPosition && kw.currentPosition > 10 && kw.searchVolume > 300)
                    .slice(0, 5)
                    .map((kw) => (
                      <div key={kw.keyword} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <div className="font-medium">{kw.keyword}</div>
                          <div className="text-sm text-gray-500">
                            Position #{kw.currentPosition} • {kw.searchVolume.toLocaleString()} recherches
                          </div>
                        </div>
                        <Badge className="bg-orange-500">À Améliorer</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Keyword Detail Modal */}
      <Dialog open={showKeywordModal} onOpenChange={setShowKeywordModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedKeyword.searchVolume.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Volume/mois</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">#{selectedKeyword.currentPosition || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Position</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">€{selectedKeyword.cpc.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">CPC</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <div className={`text-2xl font-bold ${getDifficultyColor(selectedKeyword.difficulty)}`}>
                      {selectedKeyword.difficulty > 0 ? `${selectedKeyword.difficulty}%` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Difficulté</div>
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
                          <Tooltip formatter={(value) => [`${value} recherches`, 'Volume']} />
                          <Line type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Détails SEO</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Intent:</span>
                        <div className="flex items-center gap-1">
                          {getIntentIcon(selectedKeyword.intent)}
                          <span className="capitalize">{selectedKeyword.intent}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Concurrence:</span>
                        <Badge variant={selectedKeyword.competitionLevel === 'LOW' ? 'default' : 
                                      selectedKeyword.competitionLevel === 'MEDIUM' ? 'secondary' : 'destructive'}>
                          {selectedKeyword.competitionLevel}
                        </Badge>
                      </div>
                      {selectedKeyword.serpFeatures.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600">SERP Features:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedKeyword.serpFeatures.map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature.replace('_', ' ')}
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
                        <span className="font-medium text-green-600">€{selectedKeyword.etv.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Coût Pub Estimé:</span>
                        <span className="font-medium">€{selectedKeyword.estimatedPaidCost.toFixed(2)}</span>
                      </div>
                      {selectedKeyword.trends && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Tendance Annuelle:</span>
                          <span className={`font-medium flex items-center gap-1 ${
                            selectedKeyword.trends.yearly > 0 ? 'text-green-600' : 
                            selectedKeyword.trends.yearly < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {selectedKeyword.trends.yearly > 0 ? <TrendingUp className="h-4 w-4" /> : 
                             selectedKeyword.trends.yearly < 0 ? <TrendingDown className="h-4 w-4" /> : null}
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
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Page qui Rank
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">URL:</span>
                          <a href={selectedKeyword.url} target="_blank" rel="noopener noreferrer" 
                             className="ml-2 text-blue-600 hover:underline flex items-center gap-1">
                            {selectedKeyword.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {selectedKeyword.title && (
                          <div>
                            <span className="text-sm text-gray-600">Titre:</span>
                            <p className="text-sm mt-1">{selectedKeyword.title}</p>
                          </div>
                        )}
                        {selectedKeyword.description && (
                          <div>
                            <span className="text-sm text-gray-600">Description:</span>
                            <p className="text-sm text-gray-700 mt-1">{selectedKeyword.description}</p>
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