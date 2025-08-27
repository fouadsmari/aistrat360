"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import {
  getUserPackDetails,
  hasFeatureAccess,
  canUseQuota,
  getRemainingQuota,
  type SubscriptionPack,
  type UserSubscription,
  type SubscriptionPackQuotas,
} from "@/lib/subscription-utils"

interface UseSubscriptionReturn {
  subscription: UserSubscription | null
  pack: SubscriptionPack | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>

  // Access control functions
  hasAccess: (requiredPack: "free" | "starter" | "pro" | "advanced") => boolean
  canUse: (
    quotaType: keyof SubscriptionPackQuotas,
    currentUsage: number
  ) => boolean
  getRemaining: (
    quotaType: keyof SubscriptionPackQuotas,
    currentUsage: number
  ) => number
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  )
  const [pack, setPack] = useState<SubscriptionPack | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createSupabaseClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setSubscription(null)
        setPack(null)
        return
      }

      const { subscription, pack } = await getUserPackDetails(user.id)
      setSubscription(subscription)
      setPack(pack)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch subscription"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  // Access control functions
  const hasAccess = (
    requiredPack: "free" | "starter" | "pro" | "advanced"
  ): boolean => {
    return hasFeatureAccess(subscription?.plan || null, requiredPack)
  }

  const canUse = (
    quotaType: keyof SubscriptionPackQuotas,
    currentUsage: number
  ): boolean => {
    return canUseQuota(subscription?.plan || null, quotaType, currentUsage)
  }

  const getRemaining = (
    quotaType: keyof SubscriptionPackQuotas,
    currentUsage: number
  ): number => {
    return getRemainingQuota(
      subscription?.plan || null,
      quotaType,
      currentUsage
    )
  }

  return {
    subscription,
    pack,
    loading,
    error,
    refetch: fetchSubscriptionData,
    hasAccess,
    canUse,
    getRemaining,
  }
}
