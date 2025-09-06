"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KeywordResultsTabs } from "@/components/tools/keyword-results-tabs"
import { BarChart3, Search, FileText } from "lucide-react"

interface GoogleAdsResultsTabsProps {
  results: any
  websiteName: string
  targetCountry: string
}

export function GoogleAdsResultsTabs({
  results,
  websiteName,
  targetCountry,
}: GoogleAdsResultsTabsProps) {
  const t = useTranslations("googleAds.results")

  // Use the existing KeywordResultsTabs component for Google Ads
  return (
    <div className="space-y-6">
      <KeywordResultsTabs
        results={results}
        websiteName={websiteName}
        targetCountry={targetCountry}
      />
    </div>
  )
}
