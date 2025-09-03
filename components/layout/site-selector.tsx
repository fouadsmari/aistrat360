"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Globe, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface UserWebsite {
  id: string
  url: string
  name: string | null
  business_type: "ecommerce" | "service" | "vitrine"
  target_countries: string[]
  site_languages: string[]
}

interface SiteSelectorProps {
  onSiteChange?: (siteId: string) => void
  className?: string
}

export function SiteSelector({ onSiteChange, className }: SiteSelectorProps) {
  const t = useTranslations("sites")
  const [websites, setWebsites] = useState<UserWebsite[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const fetchWebsites = useCallback(async () => {
    try {
      const response = await fetch(`/api/profile/websites`)
      if (response.ok) {
        const data = await response.json()
        setWebsites(data)

        // Auto-select first website if none selected
        if (Array.isArray(data) && data.length > 0) {
          setSelectedWebsite(data[0].id)
          onSiteChange?.(data[0].id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch websites:", error)
    } finally {
      setLoading(false)
    }
  }, [onSiteChange])

  useEffect(() => {
    fetchWebsites()
  }, [fetchWebsites])

  const handleSiteChange = (siteId: string) => {
    setSelectedWebsite(siteId)
    onSiteChange?.(siteId)
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Globe className="h-4 w-4 animate-pulse text-gray-400" />
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    )
  }

  if (!Array.isArray(websites) || websites.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button variant="outline" size="sm" className="text-xs">
          <Plus className="mr-1 h-3 w-3" />
          {t("addSite")}
        </Button>
      </div>
    )
  }

  const selectedSite = Array.isArray(websites)
    ? websites.find((w) => w.id === selectedWebsite)
    : null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      <Select value={selectedWebsite} onValueChange={handleSiteChange}>
        <SelectTrigger className="h-8 w-[200px] border-gray-300 text-xs dark:border-gray-600">
          <SelectValue placeholder={t("noSites")} />
        </SelectTrigger>
        <SelectContent>
          {Array.isArray(websites) &&
            websites.map((website) => (
              <SelectItem key={website.id} value={website.id}>
                <div className="flex w-full items-center justify-between">
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {website.name || website.url}
                    </span>
                    {website.name && (
                      <span className="text-xs text-gray-500">
                        {website.url}
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {website.business_type}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          {Array.isArray(websites) && (
            <SelectItem value="add-new" disabled>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Plus className="h-3 w-3" />
                <span className="text-xs">{t("addSite")}</span>
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
