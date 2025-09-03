"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"

interface SiteContextType {
  selectedSiteId: string | null
  setSelectedSiteId: (siteId: string | null) => void
}

const SiteContext = createContext<SiteContextType | undefined>(undefined)

export function SiteProvider({ children }: { children: ReactNode }) {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)

  // Persist selection in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedSiteId")
      if (saved) {
        setSelectedSiteId(saved)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && selectedSiteId) {
      localStorage.setItem("selectedSiteId", selectedSiteId)
    }
  }, [selectedSiteId])

  return (
    <SiteContext.Provider value={{ selectedSiteId, setSelectedSiteId }}>
      {children}
    </SiteContext.Provider>
  )
}

export function useSite() {
  const context = useContext(SiteContext)
  if (context === undefined) {
    // Return default values if context is not available
    return {
      selectedSiteId: null,
      setSelectedSiteId: () => {},
    }
  }
  return context
}
