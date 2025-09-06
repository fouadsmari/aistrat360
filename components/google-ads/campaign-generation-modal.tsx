"use client"

import { useState } from "react"
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
import { useToast } from "@/components/ui/toast"
import {
  Loader2,
  Search,
  Target,
  Bot,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface CampaignGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  pageUrl: string
  pageTitle?: string
  keywords: Array<{
    keyword: string
    searchVolume: number
    cpc: number
    competition: number
    difficulty: number
    intent: string
  }>
  websiteId: string
  onCampaignGenerated: (campaignId: string) => void
}

type CampaignType = "search" | "pmax" | "ai_recommended"

export function CampaignGenerationModal({
  isOpen,
  onClose,
  pageUrl,
  pageTitle,
  keywords,
  websiteId,
  onCampaignGenerated,
}: CampaignGenerationModalProps) {
  const t = useTranslations("googleAds.campaign")
  const { showToast } = useToast()

  const [selectedType, setSelectedType] = useState<CampaignType | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const campaignTypes = [
    {
      type: "search" as CampaignType,
      icon: Search,
      title: t("typeSearch"),
      description: t("typeSearchDesc"),
      color: "border-green-200 hover:bg-green-50 hover:border-green-300",
    },
    {
      type: "pmax" as CampaignType,
      icon: Target,
      title: t("typePmax"),
      description: t("typePmaxDesc"),
      color: "border-blue-200 hover:bg-blue-50 hover:border-blue-300",
    },
    {
      type: "ai_recommended" as CampaignType,
      icon: Bot,
      title: t("typeAiRecommended"),
      description: t("typeAiRecommendedDesc"),
      color: "border-violet-200 hover:bg-violet-50 hover:border-violet-300",
    },
  ]

  const handleGenerate = async () => {
    if (!selectedType) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/tools/google-ads/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageUrl,
          pageTitle,
          keywords,
          campaignType: selectedType,
          websiteId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || "Failed to generate campaign")
      }

      const result = await response.json()

      showToast({
        message: t("generationSuccess"),
        type: "success",
        duration: 3000,
      })

      onCampaignGenerated(result.campaign.id)
      onClose()
    } catch (error) {
      console.error("Campaign generation error:", error)
      showToast({
        message: error instanceof Error ? error.message : t("generationError"),
        type: "error",
        duration: 4000,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const resetAndClose = () => {
    setSelectedType(null)
    setIsGenerating(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-violet-600" />
            {t("createTitle")}
          </DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Page Info */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Page sélectionnée
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  {pageTitle || "Page sans titre"}
                </div>
                <div className="truncate text-xs text-gray-500">{pageUrl}</div>
                <div className="mt-2 flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {keywords.length} mots-clés
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Vol. moyen:{" "}
                    {Math.round(
                      keywords.reduce((sum, k) => sum + k.searchVolume, 0) /
                        keywords.length
                    )}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Type Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              {t("chooseType")}
            </h3>
            <div className="grid gap-3">
              {campaignTypes.map((campaign) => {
                const Icon = campaign.icon
                const isSelected = selectedType === campaign.type
                return (
                  <Card
                    key={campaign.type}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "border-violet-300 bg-violet-50 ring-2 ring-violet-500"
                        : campaign.color
                    }`}
                    onClick={() => setSelectedType(campaign.type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-lg p-2 ${
                            isSelected ? "bg-violet-100" : "bg-gray-100"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              isSelected ? "text-violet-600" : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium">
                              {campaign.title}
                            </h4>
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-violet-600" />
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-600">
                            {campaign.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              variant="outline"
              onClick={resetAndClose}
              disabled={isGenerating}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedType || isGenerating}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("generating")}
                </>
              ) : (
                t("confirmGeneration")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
