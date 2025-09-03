"use client"

import { useState, useEffect } from "react"
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
  onSiteChange?: (siteId: string) => void
  className?: string
}

export function SiteSelector({ onSiteChange, className }: SiteSelectorProps) {
  const [websites, setWebsites] = useState<any[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/profile/websites`)
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            setWebsites(data)
            if (data.length > 0 && !selectedWebsite) {
              setSelectedWebsite(data[0].id)
              onSiteChange?.(data[0].id)
            }
          } else {
            setWebsites([])
          }
        } else {
          setWebsites([])
        }
      } catch (error) {
        console.error("Failed to fetch websites:", error)
        setWebsites([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, []) // Pas de dépendances pour éviter les boucles

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

  if (websites.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button variant="outline" size="sm" className="text-xs">
          <Plus className="mr-1 h-3 w-3" />
          Add Site
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      <Select value={selectedWebsite} onValueChange={handleSiteChange}>
        <SelectTrigger className="h-8 w-[200px] border-gray-300 text-xs dark:border-gray-600">
          <SelectValue placeholder="No sites" />
        </SelectTrigger>
        <SelectContent>
          {websites.map((website) => (
            <SelectItem key={website.id} value={website.id}>
              <div className="flex w-full items-center justify-between">
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {website.name || website.url}
                  </span>
                  {website.name && (
                    <span className="text-xs text-gray-500">{website.url}</span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
