"use client"

import { ReactNode } from "react"
import { useSubscription } from "@/hooks/use-subscription"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  formatQuotaText,
  type SubscriptionPackQuotas,
} from "@/lib/subscription-utils"
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

interface QuotaUsageProps {
  quotaType: keyof SubscriptionPackQuotas
  currentUsage: number
  label: string
  unit?: string
  icon?: ReactNode
  showUpgradeButton?: boolean
  className?: string
}

export function QuotaUsage({
  quotaType,
  currentUsage,
  label,
  unit = "",
  icon,
  showUpgradeButton = true,
  className = "",
}: QuotaUsageProps) {
  const { pack, canUse, getRemaining } = useSubscription()

  if (!pack) {
    return null
  }

  const quotaLimit = pack.quotas[quotaType]
  const isUnlimited = quotaLimit === -1
  const remaining = getRemaining(quotaType, currentUsage)
  const canUseMore = canUse(quotaType, currentUsage)

  // Calculate percentage for progress bar
  const percentage = isUnlimited
    ? Math.min((currentUsage / 100) * 10, 100) // Show some usage for unlimited
    : Math.min((currentUsage / quotaLimit) * 100, 100)

  // Determine status
  const getStatus = () => {
    if (isUnlimited) return { color: "green", text: "Unlimited" }
    if (remaining === 0) return { color: "red", text: "Limit reached" }
    if (percentage >= 90) return { color: "orange", text: "Near limit" }
    if (percentage >= 75) return { color: "yellow", text: "High usage" }
    return { color: "green", text: "Available" }
  }

  const status = getStatus()

  const getStatusIcon = () => {
    switch (status.color) {
      case "red":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "orange":
      case "yellow":
        return <TrendingUp className="h-4 w-4 text-orange-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {icon}
            <span>{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge
              variant={status.color === "green" ? "default" : "secondary"}
              className={
                status.color === "red"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  : status.color === "orange" || status.color === "yellow"
                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    : ""
              }
            >
              {status.text}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Usage Numbers */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold">
                {currentUsage.toLocaleString()}
                {unit && (
                  <span className="ml-1 text-sm font-normal text-gray-500">
                    {unit}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {isUnlimited ? (
                  "Unlimited usage"
                ) : (
                  <>
                    of {quotaLimit.toLocaleString()}
                    {unit} used
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              {!isUnlimited && (
                <div className="text-lg font-semibold text-green-600">
                  {remaining.toLocaleString()}
                  <span className="ml-1 text-sm font-normal text-gray-500">
                    {unit} remaining
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress
              value={percentage}
              className={`h-2 ${
                status.color === "red"
                  ? "[&>div]:bg-red-500"
                  : status.color === "orange" || status.color === "yellow"
                    ? "[&>div]:bg-orange-500"
                    : "[&>div]:bg-green-500"
              }`}
            />
            {!isUnlimited && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>{percentage.toFixed(1)}%</span>
                <span>
                  {quotaLimit.toLocaleString()}
                  {unit}
                </span>
              </div>
            )}
          </div>

          {/* Upgrade Button */}
          {!canUseMore && showUpgradeButton && (
            <div className="pt-2">
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                onClick={() => (window.location.href = "/pricing")}
              >
                Upgrade to get more {label.toLowerCase()}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface QuotaUsageGridProps {
  currentUsage: {
    projects: number
    storage_gb: number
    api_calls_per_month: number
    team_members: number
  }
  className?: string
}

export function QuotaUsageGrid({
  currentUsage,
  className = "",
}: QuotaUsageGridProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <QuotaUsage
        quotaType="projects"
        currentUsage={currentUsage.projects}
        label="Projects"
      />
      <QuotaUsage
        quotaType="storage_gb"
        currentUsage={currentUsage.storage_gb}
        label="Storage"
        unit="GB"
      />
      <QuotaUsage
        quotaType="api_calls_per_month"
        currentUsage={currentUsage.api_calls_per_month}
        label="API Calls"
        unit="/month"
      />
      <QuotaUsage
        quotaType="team_members"
        currentUsage={currentUsage.team_members}
        label="Team Members"
      />
    </div>
  )
}
