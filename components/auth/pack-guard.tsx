"use client"

import { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/hooks/use-subscription"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Crown, Zap, Rocket } from "lucide-react"

interface PackGuardProps {
  children: ReactNode
  requiredPack: "free" | "starter" | "pro" | "advanced"
  fallback?: ReactNode
  redirectTo?: string
  showUpgrade?: boolean
}

const packIcons = {
  free: Lock,
  starter: Zap,
  pro: Rocket,
  advanced: Crown,
}

const packNames = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  advanced: "Advanced",
}

export function PackGuard({
  children,
  requiredPack,
  fallback,
  redirectTo,
  showUpgrade = true,
}: PackGuardProps) {
  const { hasAccess, pack, loading } = useSubscription()
  const router = useRouter()

  // Loading state
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // User has access
  if (hasAccess(requiredPack)) {
    return <>{children}</>
  }

  // Custom fallback
  if (fallback) {
    return <>{fallback}</>
  }

  // Redirect if specified
  if (redirectTo) {
    router.push(redirectTo)
    return null
  }

  // Default upgrade prompt
  if (showUpgrade) {
    const Icon = packIcons[requiredPack]
    const currentPackName = pack
      ? packNames[pack.name as keyof typeof packNames]
      : "No Pack"

    return (
      <Card className="mx-auto max-w-md border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
            <Icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-xl text-orange-900 dark:text-orange-100">
            Upgrade Required
          </CardTitle>
          <CardDescription className="text-orange-700 dark:text-orange-300">
            This feature requires the {packNames[requiredPack]} pack or higher.
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Current pack:
            </span>
            <Badge variant="outline" className="text-sm">
              {currentPackName}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upgrade to access this feature and unlock more capabilities.
          </p>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
          <Button
            className="flex-1 bg-orange-600 hover:bg-orange-700"
            onClick={() => router.push("/pricing")}
          >
            Upgrade Now
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Simple access denied message
  return (
    <div className="py-8 text-center">
      <Lock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
        Access Denied
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        You need the {packNames[requiredPack]} pack to access this feature.
      </p>
    </div>
  )
}
