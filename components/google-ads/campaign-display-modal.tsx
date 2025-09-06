"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/toast"
import {
  Loader2,
  Download,
  Users,
  Target,
  DollarSign,
  Globe,
  Languages,
  Eye,
  AlertCircle,
  FileText,
  TrendingUp,
} from "lucide-react"

interface CampaignDisplayModalProps {
  isOpen: boolean
  onClose: () => void
  pageUrl: string
}

interface Campaign {
  id: string
  campaign_name: string
  campaign_type: string
  recommended_type: string
  personas: Array<{
    name: string
    age_range: string
    gender: string
    interests: string[]
    behavior: string
    pain_points: string[]
  }>
  headlines: string[]
  descriptions: string[]
  budget_recommendation: number
  target_locations: string[]
  target_languages: string[]
  bid_strategy: string
  target_cpa: number
  target_roas: number
  page_title: string
  keywords: Array<{
    keyword: string
    searchVolume: number
    cpc: number
    intent: string
  }>
  created_at: string
}

export function CampaignDisplayModal({
  isOpen,
  onClose,
  pageUrl,
}: CampaignDisplayModalProps) {
  const t = useTranslations("googleAds.campaign")
  const { showToast } = useToast()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchCampaign = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/tools/google-ads/campaigns?page_url=${encodeURIComponent(pageUrl)}`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch campaign")
      }

      const result = await response.json()
      if (result.campaigns && result.campaigns.length > 0) {
        setCampaign(result.campaigns[0]) // Get the latest campaign for this page
      } else {
        setCampaign(null)
      }
    } catch (error) {
      console.error("Failed to fetch campaign:", error)
      showToast({
        message:
          error instanceof Error ? error.message : t("errorLoadingResults"),
        type: "error",
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }, [pageUrl, showToast, t])

  useEffect(() => {
    if (isOpen && pageUrl) {
      fetchCampaign()
    }
  }, [isOpen, pageUrl, fetchCampaign])

  const handleExport = async () => {
    if (!campaign) return

    setExporting(true)
    try {
      const response = await fetch(
        `/api/tools/google-ads/export/${campaign.id}`
      )
      if (!response.ok) {
        throw new Error("Failed to export campaign")
      }

      // Download the Excel file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `GoogleAds_${campaign.campaign_name}_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showToast({
        message: "Le fichier Excel a été téléchargé",
        type: "success",
        duration: 3000,
      })
    } catch (error) {
      console.error("Export error:", error)
      showToast({
        message: error instanceof Error ? error.message : t("exportError"),
        type: "error",
        duration: 4000,
      })
    } finally {
      setExporting(false)
    }
  }

  const resetAndClose = () => {
    setCampaign(null)
    setLoading(false)
    setExporting(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            {t("displayTitle")}
          </DialogTitle>
          <DialogDescription>
            Campagne générée pour: {pageUrl}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
              <span className="ml-2">{t("loadingResults")}</span>
            </div>
          )}

          {!loading && !campaign && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-amber-800">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{t("noResults")}</p>
                    <p className="text-sm">
                      Veuillez d&apos;abord générer une campagne pour cette
                      page.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {campaign && (
            <>
              {/* Campaign Header */}
              <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-gray-900">
                        {campaign.campaign_name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {campaign.page_title}
                      </CardDescription>
                      <div className="mt-3 flex gap-2">
                        <Badge
                          variant={
                            campaign.recommended_type === "pmax"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {campaign.recommended_type === "pmax"
                            ? "Performance Max"
                            : "Search"}
                        </Badge>
                        <Badge variant="outline">
                          {campaign.keywords?.length || 0} mots-clés
                        </Badge>
                        <Badge variant="outline">
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={handleExport}
                      disabled={exporting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {exporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("exporting")}
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          {t("exportExcel")}
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Personas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5 text-violet-600" />
                      {t("personas")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {campaign.personas?.map((persona, index) => (
                      <div key={index} className="rounded-lg bg-gray-50 p-3">
                        <h4 className="font-medium text-gray-900">
                          {persona.name}
                        </h4>
                        <div className="mt-1 space-y-1 text-sm text-gray-600">
                          <p>
                            <strong>Âge:</strong> {persona.age_range}
                          </p>
                          <p>
                            <strong>Genre:</strong> {persona.gender}
                          </p>
                          {persona.interests?.length > 0 && (
                            <p>
                              <strong>Intérêts:</strong>{" "}
                              {persona.interests.join(", ")}
                            </p>
                          )}
                          <p>
                            <strong>Comportement:</strong> {persona.behavior}
                          </p>
                          {persona.pain_points?.length > 0 && (
                            <p>
                              <strong>Points de douleur:</strong>{" "}
                              {persona.pain_points.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Campaign Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-blue-600" />
                      {t("settings")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{t("budget")}:</span>
                      <Badge variant="outline">
                        €{campaign.budget_recommendation}/jour
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{t("locations")}:</span>
                      <div className="flex flex-wrap gap-1">
                        {campaign.target_locations?.map((location, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {location}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">{t("languages")}:</span>
                      <div className="flex flex-wrap gap-1">
                        {campaign.target_languages?.map((language, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Stratégie:</span>
                      <Badge variant="outline">{campaign.bid_strategy}</Badge>
                    </div>
                    {campaign.target_cpa && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">CPA cible:</span>
                        <Badge variant="outline">€{campaign.target_cpa}</Badge>
                      </div>
                    )}
                    {campaign.target_roas && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">ROAS cible:</span>
                        <Badge variant="outline">{campaign.target_roas}%</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Headlines & Descriptions */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                      {t("headlines")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {campaign.headlines?.map((headline, index) => (
                        <div
                          key={index}
                          className="rounded border border-green-200 bg-green-50 p-2 text-sm"
                        >
                          <span className="font-mono">{headline}</span>
                          <span className="ml-2 text-xs text-green-600">
                            ({headline.length}/30)
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                      {t("descriptions")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {campaign.descriptions?.map((description, index) => (
                        <div
                          key={index}
                          className="rounded border border-blue-200 bg-blue-50 p-3 text-sm"
                        >
                          <span className="font-mono">{description}</span>
                          <span className="ml-2 text-xs text-blue-600">
                            ({description.length}/90)
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <Button variant="outline" onClick={resetAndClose}>
                  Fermer
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={exporting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("exporting")}
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      {t("exportExcel")}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
