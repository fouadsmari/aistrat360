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
import { DataForSEOResults } from "./dataforseo-results"
import {
  Globe,
  Search,
  Loader2,
  BarChart3,
  AlertCircle,
  PlayCircle,
  CheckCircle,
  XCircle,
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

export function DataForSEOAnalysis() {
  const t = useTranslations("tools.dataforseo")
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

  // Progress steps with their messages
  const progressSteps = [
    { progress: 20, message: t("progress.step1") },
    { progress: 40, message: t("progress.step2") },
    { progress: 60, message: t("progress.step3") },
    { progress: 80, message: t("progress.step4") },
    { progress: 100, message: t("progress.step5") },
  ]

  // Fetch user websites
  const fetchWebsites = useCallback(async () => {
    try {
      const response = await fetch("/api/profile/websites")
      if (!response.ok) throw new Error("Failed to fetch websites")

      const data = await response.json()
      setWebsites(data.websites || [])
    } catch (error) {
      console.error("Error fetching websites:", error)
      showToast({
        message: t("errors.networkError"),
        type: "error",
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }, [showToast, t])

  // Start DataForSEO analysis
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
      const response = await fetch("/api/tools/dataforseo/analyze", {
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
      console.error("Error starting analysis:", error)
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
        const response = await fetch(
          `/api/tools/dataforseo/status/${analysisId}`
        )
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
        console.error("Error polling progress:", error)
        clearInterval(pollInterval)
        setAnalysisInProgress(null)
      }
    }, 2000) // Poll every 2 seconds
  }

  // Cancel analysis
  const cancelAnalysis = async () => {
    if (!analysisInProgress) return

    try {
      await fetch(`/api/tools/dataforseo/cancel/${analysisInProgress.id}`, {
        method: "POST",
      })

      setAnalysisInProgress(null)
      showToast({
        message: "Analysis cancelled",
        type: "info",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error cancelling analysis:", error)
    }
  }

  useEffect(() => {
    fetchWebsites()
  }, [fetchWebsites])

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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>{t("description")}</CardDescription>
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
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Go to Profile
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
                    <SelectContent>
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

                {/* Analysis Controls */}
                <div className="flex items-center gap-3">
                  {!analysisInProgress ? (
                    <Button
                      onClick={startAnalysis}
                      disabled={!selectedWebsite}
                      className="bg-blue-600 hover:bg-blue-700"
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
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
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

        {/* Analysis Results */}
        {analysisResults && (
          <DataForSEOResults
            results={analysisResults}
            websiteName={
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
