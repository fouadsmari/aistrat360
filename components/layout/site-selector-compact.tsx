"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Globe, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SiteSelectorProps {
  className?: string
}

export function SimpleSiteSelector({ className }: SiteSelectorProps) {
  const [websites, setWebsites] = useState<any[]>([])
  const [selectedSite, setSelectedSite] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/profile/websites`)
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            setWebsites(data)
            // Auto-select first site
            const savedSite =
              typeof window !== "undefined"
                ? localStorage.getItem("selectedSiteId")
                : null
            if (savedSite && data.find((w: any) => w.id === savedSite)) {
              setSelectedSite(savedSite)
            } else if (data.length > 0) {
              setSelectedSite(data[0].id)
              if (typeof window !== "undefined") {
                localStorage.setItem("selectedSiteId", data[0].id)
              }
            }
          }
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSiteChange = (siteId: string) => {
    setSelectedSite(siteId)
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedSiteId", siteId)
      // Trigger a custom event for other components to listen
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

  if (!websites || websites.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/${locale}/profile`)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Ajouter un site
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      <Select value={selectedSite} onValueChange={handleSiteChange}>
        <SelectTrigger className="h-10 w-[450px] border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <SelectValue placeholder="Sélectionner un site" />
        </SelectTrigger>
        <SelectContent className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {websites.map((website) => (
            <SelectItem key={website.id} value={website.id}>
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium">
                  {website.name || website.url}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
