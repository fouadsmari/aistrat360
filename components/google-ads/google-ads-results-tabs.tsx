"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KeywordResults } from "@/components/tools/keyword-results"
import { EnhancedKeywordResults } from "@/components/tools/enhanced-keyword-results"
import { BarChart3, FileText } from "lucide-react"

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
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6">
      {/* Hero Dashboard Summary */}
      <EnhancedKeywordResults
        analysisId={results.id}
        websiteName={websiteName}
        summaryOnly={true}
      />

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-violet-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-violet-400"
          >
            <BarChart3 className="h-4 w-4" />
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger
            value="pages"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-violet-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-violet-400"
          >
            <FileText className="h-4 w-4" />
            Pages
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble - Tableau principal avec filtres */}
        <TabsContent value="overview" className="space-y-6">
          <KeywordResults
            results={results}
            websiteName={websiteName}
            targetCountry={targetCountry}
            hideEnhancedResults={true}
          />
        </TabsContent>

        {/* Pages - Analyse par pages */}
        <TabsContent value="pages" className="space-y-6">
          <EnhancedKeywordResults
            analysisId={results.id}
            websiteName={websiteName}
            pagesOnly={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
