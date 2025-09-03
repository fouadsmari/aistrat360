"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { KeywordResults } from "./keyword-results"
import {
  Globe,
  Search,
  Loader2,
  BarChart3,
  AlertCircle,
  PlayCircle,
  CheckCircle,
  XCircle,
  History,
  Calendar,
} from "lucide-react"

interface UserWebsite {
  id: string
  url: string
  name: string | null
  business_type: "ecommerce" | "service" | "vitrine"
  target_countries: string[]
  site_languages: string[]
}

interface AnalysisProgress {
  id: string
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  progress: number
  currentStep: string
  error?: string
}

interface AnalysisResults {
  id: string
  totalKeywords: number
  rankedKeywords: number
  opportunities: number
  cost: number
  status?: string
  websiteName?: string
  created_at?: string
  completed_at?: string
  keywords: Array<{
    keyword: string
    type: "ranked" | "suggestion"
    searchVolume: number
    difficulty: number
    cpc: number
    position?: number
    url?: string
  }>
}

export function KeywordAnalysis() {
  const t = useTranslations("tools.keywords")
  const tCommon = useTranslations("common")
  const params = useParams()
  const locale = params.locale as string
  const { showToast, ToastComponent } = useToast()

  const [websites, setWebsites] = useState<UserWebsite[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [analysisInProgress, setAnalysisInProgress] =
    useState<AnalysisProgress | null>(null)
  const [analysisResults, setAnalysisResults] =
    useState<AnalysisResults | null>(null)
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResults[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [quota, setQuota] = useState<{
    used: number
    limit: number
    remaining: number
    isUnlimited?: boolean
  } | null>(null)

  // Progress steps with their messages
  const progressSteps = [
    { progress: 20, message: t("progress.step1") },
    { progress: 40, message: t("progress.step2") },
    { progress: 60, message: t("progress.step3") },
    { progress: 80, message: t("progress.step4") },
    { progress: 100, message: t("progress.step5") },
  ]

  // Fetch user websites, quota and analysis history
  const fetchWebsites = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const [websitesResponse, quotaResponse, historyResponse] =
        await Promise.all([
          fetch("/api/profile/websites", { signal: controller.signal }),
          fetch("/api/tools/keywords/quota", { signal: controller.signal }),
          fetch("/api/tools/keywords/history", { signal: controller.signal }),
        ])

      clearTimeout(timeoutId)

      if (!websitesResponse.ok) throw new Error("Failed to fetch websites")

      const websitesData = await websitesResponse.json()
      setWebsites(websitesData.websites || [])

      if (quotaResponse.ok) {
        const quotaData = await quotaResponse.json()
        setQuota(quotaData.quota)
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setAnalysisHistory(historyData.analyses || [])

        // Load last completed analysis as current result
        const lastCompleted = historyData.analyses?.find(
          (a: any) => a.status === "completed"
        )
        if (lastCompleted) {
          setAnalysisResults(lastCompleted)
        }
      }
    } catch (error: any) {
      console.error("Network error:", error)
      // Only show error for non-timeout/abort errors
      if (error.name !== "AbortError") {
        console.error("Fetch failed:", error.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Start keyword analysis
  const startAnalysis = async () => {
    if (!selectedWebsite) {
      showToast({
        message: t("errors.noWebsiteSelected"),
        type: "error",
        duration: 4000,
      })
      return
    }

    const website = websites.find((w) => w.id === selectedWebsite)
    if (!website) return

    try {
      const response = await fetch("/api/tools/keywords/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId: selectedWebsite,
          country: website.target_countries[0] || "FR",
          language: website.site_languages[0] || "fr",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      const data = await response.json()

      // Start polling for progress
      setAnalysisInProgress({
        id: data.analysisId,
        status: "processing",
        progress: 0,
        currentStep: t("progress.step1"),
      })

      pollAnalysisProgress(data.analysisId)
    } catch (error: any) {
      showToast({
        message: error.message || t("errors.analysisError"),
        type: "error",
        duration: 4000,
      })
    }
  }

  // Poll analysis progress
  const pollAnalysisProgress = async (analysisId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/tools/keywords/status/${analysisId}`)
        if (!response.ok) throw new Error("Failed to get analysis status")

        const data = await response.json()

        setAnalysisInProgress((prev) => {
          if (!prev) return null

          // Find current step message
          const currentStepIndex = Math.floor(data.progress / 20)
          const stepMessage =
            progressSteps[currentStepIndex]?.message || prev.currentStep

          return {
            ...prev,
            status: data.status,
            progress: data.progress,
            currentStep: stepMessage,
            error: data.error,
          }
        })

        if (data.status === "completed") {
          clearInterval(pollInterval)
          setAnalysisInProgress(null)
          setAnalysisResults(data.results)

          showToast({
            message: "Analysis completed successfully!",
            type: "success",
            duration: 3000,
          })
        } else if (data.status === "failed") {
          clearInterval(pollInterval)
          setAnalysisInProgress(null)

          showToast({
            message: data.error || t("errors.analysisError"),
            type: "error",
            duration: 4000,
          })
        }
      } catch (error) {
        clearInterval(pollInterval)
        setAnalysisInProgress(null)
      }
    }, 2000) // Poll every 2 seconds
  }

  // Cancel analysis
  const cancelAnalysis = async () => {
    if (!analysisInProgress) return

    try {
      await fetch(`/api/tools/keywords/cancel/${analysisInProgress.id}`, {
        method: "POST",
      })

      setAnalysisInProgress(null)
      showToast({
        message: "Analysis cancelled",
        type: "info",
        duration: 3000,
      })
    } catch (error) {}
  }

  useEffect(() => {
    fetchWebsites()
  }, [fetchWebsites])

  // Auto-load last report when website is selected
  useEffect(() => {
    if (selectedWebsite && analysisHistory.length > 0) {
      // Find the website data to match by URL
      const selectedWebsiteData = websites.find((w) => w.id === selectedWebsite)
      if (!selectedWebsiteData) return

      // Find analyses for this website
      const websiteAnalyses = analysisHistory.filter((a: any) => {
        // Match by website name or URL
        return (
          (a.websiteName === selectedWebsiteData.name ||
            a.websiteName === selectedWebsiteData.url ||
            a.websiteId === selectedWebsite) &&
          a.status === "completed"
        )
      })

      if (websiteAnalyses.length > 0) {
        const lastAnalysis = websiteAnalyses[0] // Already sorted by date in API
        setAnalysisResults(lastAnalysis)
      } else {
        // Clear results if no analysis found for this website
        setAnalysisResults(null)
      }
    }
  }, [selectedWebsite, analysisHistory, websites])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{tCommon("loading")}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/20">
                <Search className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-gray-900 dark:text-white">
                  {t("title")}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {t("description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {websites.length === 0 ? (
              <div className="py-8 text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                  {t("noWebsites")}
                </h3>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                  {t("addWebsiteFirst")}
                </p>
                <Button
                  onClick={() => window.open(`/${locale}/profile`, "_blank")}
                  variant="outline"
                  className="border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  {t("goToProfile")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Website Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("selectWebsite")}
                  </label>
                  <Select
                    value={selectedWebsite}
                    onValueChange={setSelectedWebsite}
                    disabled={!!analysisInProgress}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectWebsite")} />
                    </SelectTrigger>
                    <SelectContent className="border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                      {websites.map((website) => (
                        <SelectItem key={website.id} value={website.id}>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>{website.name || website.url}</span>
                            <Badge variant="outline" className="text-xs">
                              {website.business_type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quota Display */}
                {quota && (
                  <div className="rounded-lg border bg-gray-50 p-3 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-violet-600" />
                        <span className="text-sm font-medium">
                          {t("quota.title")}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {quota.isUnlimited ? (
                            <span className="text-green-600">∞ Illimité</span>
                          ) : (
                            <span>
                              {quota.used}/{quota.limit}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {quota.remaining} restant
                          {quota.remaining !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    {!quota.isUnlimited && (
                      <div className="mt-2">
                        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600"
                            style={{
                              width: `${Math.min((quota.used / quota.limit) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Analysis Controls */}
                <div className="flex items-center gap-3">
                  {!analysisInProgress ? (
                    <Button
                      onClick={startAnalysis}
                      disabled={
                        !selectedWebsite ||
                        (quota?.remaining !== undefined && quota.remaining <= 0)
                      }
                      className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 disabled:opacity-50"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      {t("startAnalysis")}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={cancelAnalysis}
                        variant="outline"
                        size="sm"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {tCommon("cancel")}
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t("analysisRunning")}
                      </span>
                    </div>
                  )}

                  {quota && quota.remaining <= 0 && !quota.isUnlimited && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-600">
                        {t("quota.exceeded")}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(`/${locale}/pricing`, "_blank")
                        }
                      >
                        {t("quota.upgrade")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Tracking */}
        {analysisInProgress && (
          <Card>
            <CardContent className="py-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                    <span className="font-medium">
                      {analysisInProgress.currentStep}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {analysisInProgress.progress}%
                  </span>
                </div>

                <Progress value={analysisInProgress.progress} className="h-2" />

                <div className="flex justify-between text-xs text-gray-500">
                  <span>Started</span>
                  <span>
                    {analysisInProgress.progress < 100
                      ? `~${Math.round((100 - analysisInProgress.progress) / 20)} min remaining`
                      : "Almost done..."}
                  </span>
                </div>

                {analysisInProgress.error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">
                    {analysisInProgress.error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis History */}
        {analysisHistory.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-violet-600" />
                    {t("history.title")}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("history.description")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? t("history.hide") : t("history.show")}
                </Button>
              </div>
            </CardHeader>
            {showHistory && (
              <CardContent>
                <div className="space-y-3">
                  {analysisHistory.slice(0, 5).map((analysis) => (
                    <div
                      key={analysis.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => setAnalysisResults(analysis)}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <Badge
                            variant={
                              analysis.status === "completed"
                                ? "default"
                                : analysis.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {analysis.status === "completed" && "✓"}
                            {analysis.status === "failed" && "✗"}
                            {analysis.status === "processing" && "⏳"}
                            {analysis.status}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {analysis.websiteName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {analysis.totalKeywords} mots-clés •{" "}
                            {analysis.created_at
                              ? new Date(
                                  analysis.created_at
                                ).toLocaleDateString()
                              : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          €{analysis.cost.toFixed(3)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {analysis.created_at
                            ? new Date(analysis.created_at).toLocaleTimeString()
                            : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Analysis Results */}
        {analysisResults && (
          <KeywordResults
            results={analysisResults}
            websiteName={
              analysisResults.websiteName ||
              websites.find((w) => w.id === selectedWebsite)?.name ||
              websites.find((w) => w.id === selectedWebsite)?.url ||
              ""
            }
          />
        )}
      </div>

      {ToastComponent}
    </>
  )
}
