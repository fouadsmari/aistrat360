"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Globe } from "lucide-react"

// Dynamic import with no SSR to avoid hydration issues
const SiteSelector = dynamic(
  () => import("./site-selector-safe").then((mod) => mod.SiteSelector),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 animate-pulse text-gray-400" />
        <div className="h-9 w-[250px] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    ),
  }
)

interface SiteSelectorWrapperProps {
  className?: string
}

export function SiteSelectorWrapper({ className }: SiteSelectorWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 animate-pulse text-gray-400" />
          <div className="h-9 w-[250px] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      }
    >
      <SiteSelector className={className} />
    </Suspense>
  )
}
