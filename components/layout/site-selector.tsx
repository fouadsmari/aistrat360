"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Globe, Plus, LogIn } from "lucide-react"
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
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [websites, setWebsites] = useState<UserWebsite[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  const fetchWebsites = useCallback(async () => {
    try {
      const response = await fetch(`/api/profile/websites`)
      if (response.ok) {
        const data = await response.json()
        // Handle both array and object with websites property
        const websitesList = Array.isArray(data) ? data : data.websites || []
        setWebsites(websitesList)

        // Check localStorage for saved selection
        const savedSite =
          typeof window !== "undefined"
            ? localStorage.getItem("selectedSiteId")
            : null

        // Auto-select saved site or first website if none selected
        if (websitesList.length > 0) {
          if (
            savedSite &&
            websitesList.find((w: UserWebsite) => w.id === savedSite)
          ) {
            setSelectedWebsite(savedSite)
            onSiteChange?.(savedSite)
          } else {
            setSelectedWebsite(websitesList[0].id)
            onSiteChange?.(websitesList[0].id)
            if (typeof window !== "undefined") {
              localStorage.setItem("selectedSiteId", websitesList[0].id)
            }
          }
        }
      } else {
        // If not authenticated or error, just set empty array
        setWebsites([])
        if (response.status === 401 || response.status === 403) {
          setIsAuthenticated(false)
        }
      }
    } catch (error) {
      // Handle error silently
      setWebsites([])
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

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedSiteId", siteId)
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent("siteChanged", { detail: siteId }))
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Globe className="h-4 w-4 animate-pulse text-gray-400" />
        <div className="h-9 w-[250px] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/${locale}/login`)}
        >
          <LogIn className="mr-1 h-4 w-4" />
          <span>Se connecter</span>
        </Button>
      </div>
    )
  }

  if (!Array.isArray(websites) || websites.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/${locale}/profile`)}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("addSite") || "Ajouter un site"}
        </Button>
      </div>
    )
  }

  const selectedSite = Array.isArray(websites)
    ? websites.find((w) => w.id === selectedWebsite)
    : null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      <Select value={selectedWebsite} onValueChange={handleSiteChange}>
        <SelectTrigger className="h-10 w-full max-w-[450px] border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:w-[450px]">
          <SelectValue placeholder={t("selectSite") || "Select a website"} />
        </SelectTrigger>
        <SelectContent className="min-w-[300px] border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:min-w-[450px]">
          {Array.isArray(websites) &&
            websites.map((website) => (
              <SelectItem key={website.id} value={website.id}>
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 flex-col items-start">
                    <span className="truncate text-sm font-medium">
                      {website.name || website.url}
                    </span>
                    {website.name && (
                      <span className="truncate text-xs text-gray-500">
                        {website.url}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant={
                      website.business_type === "ecommerce"
                        ? "default"
                        : "secondary"
                    }
                    className={`ml-2 flex-shrink-0 text-xs ${
                      website.business_type === "ecommerce"
                        ? "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : website.business_type === "service"
                          ? "border-green-300 bg-green-100 text-green-700 dark:border-green-700 dark:bg-green-900/50 dark:text-green-300"
                          : "border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                    }`}
                  >
                    {website.business_type === "ecommerce"
                      ? "E-commerce"
                      : website.business_type === "service"
                        ? "Service"
                        : "Vitrine"}
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
