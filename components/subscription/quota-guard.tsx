"use client"

import { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/hooks/use-subscription"
import { type SubscriptionPackQuotas } from "@/lib/subscription-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, TrendingUp } from "lucide-react"
import { useState } from "react"

interface QuotaGuardProps {
  children: ReactNode
  quotaType: keyof SubscriptionPackQuotas
  currentUsage: number
  action?: string
  onQuotaExceeded?: () => void
  showWarningAt?: number // Percentage to show warning (default: 90)
  blockAt?: number // Percentage to block action (default: 100)
}

export function QuotaGuard({
  children,
  quotaType,
  currentUsage,
  action = "perform this action",
  onQuotaExceeded,
  showWarningAt = 90,
  blockAt = 100,
}: QuotaGuardProps) {
  const { pack, canUse, getRemaining } = useSubscription()
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)

  if (!pack) {
    return <>{children}</>
  }

  const quotaLimit = pack.quotas[quotaType]
  const isUnlimited = quotaLimit === -1
  const canProceed = canUse(quotaType, currentUsage)
  const remaining = getRemaining(quotaType, currentUsage)

  // Calculate usage percentage
  const percentage = isUnlimited
    ? 0
    : Math.min((currentUsage / quotaLimit) * 100, 100)

  // Determine if we should show warning or block
  const shouldShowWarning =
    !isUnlimited && percentage >= showWarningAt && percentage < blockAt
  const shouldBlock = !isUnlimited && percentage >= blockAt

  // If unlimited or under threshold, render children normally
  if (isUnlimited || (!shouldShowWarning && !shouldBlock)) {
    return <>{children}</>
  }

  // Handle quota exceeded
  const handleQuotaExceeded = () => {
    if (onQuotaExceeded) {
      onQuotaExceeded()
    } else {
      setShowDialog(true)
    }
  }

  // If should block, replace children with button that shows quota dialog
  if (shouldBlock) {
    return (
      <>
        <Button
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
          onClick={handleQuotaExceeded}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Quota Exceeded
        </Button>
        <QuotaDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          quotaType={quotaType}
          currentUsage={currentUsage}
          quotaLimit={quotaLimit}
          remaining={remaining}
          percentage={percentage}
          action={action}
          pack={pack}
        />
      </>
    )
  }

  // If should show warning, wrap children with click handler
  if (shouldShowWarning) {
    return (
      <>
        <div onClick={handleQuotaExceeded} className="cursor-pointer">
          {children}
        </div>
        <QuotaDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          quotaType={quotaType}
          currentUsage={currentUsage}
          quotaLimit={quotaLimit}
          remaining={remaining}
          percentage={percentage}
          action={action}
          pack={pack}
          isWarning
        />
      </>
    )
  }

  return <>{children}</>
}

interface QuotaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotaType: keyof SubscriptionPackQuotas
  currentUsage: number
  quotaLimit: number
  remaining: number
  percentage: number
  action: string
  pack: any
  isWarning?: boolean
}

function QuotaDialog({
  open,
  onOpenChange,
  quotaType,
  currentUsage,
  quotaLimit,
  remaining,
  percentage,
  action,
  pack,
  isWarning = false,
}: QuotaDialogProps) {
  const router = useRouter()

  const quotaLabels: Record<keyof SubscriptionPackQuotas, string> = {
    projects: "projects",
    storage_gb: "GB of storage",
    api_calls_per_month: "API calls per month",
    team_members: "team members",
  }

  const quotaLabel = quotaLabels[quotaType] || quotaType

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isWarning ? (
              <TrendingUp className="h-5 w-5 text-orange-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            {isWarning ? "Quota Warning" : "Quota Exceeded"}
          </DialogTitle>
          <DialogDescription>
            {isWarning
              ? `You're approaching your ${quotaLabel} limit.`
              : `You've reached your ${quotaLabel} limit and cannot ${action}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Pack */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Pack:</span>
            <Badge>{pack.display_name_en}</Badge>
          </div>

          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Usage: {currentUsage.toLocaleString()} /{" "}
                {quotaLimit.toLocaleString()}
              </span>
              <span className="text-gray-500">{percentage.toFixed(1)}%</span>
            </div>
            <Progress
              value={percentage}
              className={`h-2 ${
                isWarning ? "[&>div]:bg-orange-500" : "[&>div]:bg-red-500"
              }`}
            />
            <div className="text-center text-xs text-gray-500">
              {remaining > 0
                ? `${remaining.toLocaleString()} ${quotaLabel} remaining`
                : `No ${quotaLabel} remaining`}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {isWarning ? "Continue Anyway" : "Got It"}
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              router.push("/pricing")
            }}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 sm:w-auto"
          >
            Upgrade Pack
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
