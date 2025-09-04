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
import { useSite } from "@/contexts/site-context"

interface SiteSelectorProps {
  className?: string
}

export function SiteSelector({ className }: SiteSelectorProps) {
  const [websites, setWebsites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedSiteId, setSelectedSiteId } = useSite()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/profile/websites`)
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            setWebsites(data)
            if (data.length > 0 && !selectedSiteId) {
              setSelectedSiteId(data[0].id)
            }
          } else {
            setWebsites([])
          }
        } else {
          setWebsites([])
        }
      } catch (error) {
        setWebsites([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId)
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
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => router.push(`/${locale}/profile`)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Site
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      <Select value={selectedSiteId || ""} onValueChange={handleSiteChange}>
        <SelectTrigger className="h-9 w-[250px] border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <SelectValue placeholder="Select a website" />
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
