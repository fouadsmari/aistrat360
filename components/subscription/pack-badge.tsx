"use client"

import { Badge } from "@/components/ui/badge"
import { useSubscription } from "@/hooks/use-subscription"
import { Crown, Rocket, Zap, Sparkles, Loader2 } from "lucide-react"

interface PackBadgeProps {
  showIcon?: boolean
  variant?: "default" | "outline" | "secondary"
  size?: "sm" | "default" | "lg"
  className?: string
}

const packConfig = {
  free: {
    name: "Free",
    icon: Sparkles,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
  starter: {
    name: "Starter",
    icon: Zap,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  pro: {
    name: "Pro",
    icon: Rocket,
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  advanced: {
    name: "Advanced",
    icon: Crown,
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
} as const

export function PackBadge({
  showIcon = true,
  variant = "default",
  size = "default",
  className = "",
}: PackBadgeProps) {
  const { pack, loading } = useSubscription()

  if (loading) {
    return (
      <Badge variant={variant} className={className}>
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        Loading...
      </Badge>
    )
  }

  if (!pack) {
    return (
      <Badge variant="outline" className={className}>
        No Pack
      </Badge>
    )
  }

  const config = packConfig[pack.name as keyof typeof packConfig]
  const Icon = config.icon

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  }

  return (
    <Badge
      variant={variant}
      className={` ${variant === "default" ? config.color : ""} ${sizeClasses[size]} ${className} `}
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.name}
    </Badge>
  )
}

interface PackStatusProps {
  showQuotas?: boolean
  className?: string
}

export function PackStatus({
  showQuotas = false,
  className = "",
}: PackStatusProps) {
  const { pack, subscription, loading } = useSubscription()

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="mb-2 h-4 w-24 rounded bg-gray-200"></div>
        <div className="h-3 w-32 rounded bg-gray-200"></div>
      </div>
    )
  }

  if (!pack || !subscription) {
    return (
      <div className={className}>
        <div className="text-sm text-gray-500">No active subscription</div>
      </div>
    )
  }

  const config = packConfig[pack.name as keyof typeof packConfig]

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2">
        <PackBadge />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {subscription.status === "active" ? "Active" : subscription.status}
        </span>
      </div>

      {showQuotas && (
        <div className="space-y-1 text-xs text-gray-500">
          <div>
            Projects:{" "}
            {pack.quotas.projects === -1 ? "Unlimited" : pack.quotas.projects}
          </div>
          <div>
            Storage:{" "}
            {pack.quotas.storage_gb === -1
              ? "Unlimited"
              : `${pack.quotas.storage_gb}GB`}
          </div>
          <div>
            API:{" "}
            {pack.quotas.api_calls_per_month === -1
              ? "Unlimited"
              : `${pack.quotas.api_calls_per_month.toLocaleString()}/mo`}
          </div>
          <div>
            Team:{" "}
            {pack.quotas.team_members === -1
              ? "Unlimited"
              : pack.quotas.team_members}
          </div>
        </div>
      )}
    </div>
  )
}
