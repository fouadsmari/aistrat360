import { createSupabaseClient } from "./supabase"

export interface SubscriptionPackFeature {
  en: string
  fr: string
}

export interface SubscriptionPackQuotas {
  projects: number // -1 for unlimited
  storage_gb: number // -1 for unlimited
  api_calls_per_month: number // -1 for unlimited
  team_members: number // -1 for unlimited
  [key: string]: number // Allow additional quota fields
}

export interface SubscriptionPack {
  id: string
  name: "free" | "starter" | "pro" | "advanced"
  display_name_en: string
  display_name_fr: string
  description_en: string
  description_fr: string
  price_monthly: number
  price_yearly: number
  features: SubscriptionPackFeature[]
  quotas: SubscriptionPackQuotas
  is_enabled: boolean
  is_popular: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

// Legacy interface for backward compatibility
export interface SubscriptionPlan extends SubscriptionPack {
  trial_days: number
}

export interface UserSubscription {
  id: string
  user_id: string
  plan: string
  status: string
  current_period_start: string
  current_period_end: string | null
  trial_start: string | null
  trial_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export const HARDCODED_PACKS: SubscriptionPack[] = [
  {
    id: "free",
    name: "free",
    display_name_en: "Free",
    display_name_fr: "Gratuit",
    description_en: "Free access to basic features",
    description_fr: "Accès gratuit aux fonctionnalités de base",
    price_monthly: 0,
    price_yearly: 0,
    features: [
      {
        en: "Basic features access",
        fr: "Accès aux fonctionnalités de base",
      },
      { en: "1 project", fr: "1 projet" },
      { en: "Community support", fr: "Support communautaire" },
    ],
    quotas: {
      projects: 1,
      storage_gb: 1,
      api_calls_per_month: 1000,
      team_members: 1,
    },
    is_enabled: true,
    is_popular: false,
    sort_order: 0,
  },
  {
    id: "starter",
    name: "starter",
    display_name_en: "Starter",
    display_name_fr: "Starter",
    description_en: "Perfect for individuals and small teams",
    description_fr: "Parfait pour les particuliers et petites équipes",
    price_monthly: 9.99,
    price_yearly: 99.99,
    features: [
      { en: "All basic features", fr: "Toutes les fonctionnalités de base" },
      { en: "5 projects", fr: "5 projets" },
      { en: "10GB storage", fr: "10GB de stockage" },
      { en: "Email support", fr: "Support par email" },
      { en: "Mobile app access", fr: "Accès à l'application mobile" },
    ],
    quotas: {
      projects: 5,
      storage_gb: 10,
      api_calls_per_month: 10000,
      team_members: 3,
    },
    is_enabled: true,
    is_popular: false,
    sort_order: 1,
  },
  {
    id: "pro",
    name: "pro",
    display_name_en: "Pro",
    display_name_fr: "Pro",
    description_en: "Best for growing businesses and teams",
    description_fr: "Idéal pour les entreprises en croissance et les équipes",
    price_monthly: 29.99,
    price_yearly: 299.99,
    features: [
      { en: "All Starter features", fr: "Toutes les fonctionnalités Starter" },
      { en: "25 projects", fr: "25 projets" },
      { en: "100GB storage", fr: "100GB de stockage" },
      { en: "Priority support", fr: "Support prioritaire" },
      { en: "Advanced analytics", fr: "Analyses avancées" },
      { en: "Team collaboration", fr: "Collaboration d'équipe" },
      { en: "API access", fr: "Accès API" },
    ],
    quotas: {
      projects: 25,
      storage_gb: 100,
      api_calls_per_month: 100000,
      team_members: 10,
    },
    is_enabled: true,
    is_popular: true,
    sort_order: 2,
  },
  {
    id: "advanced",
    name: "advanced",
    display_name_en: "Advanced",
    display_name_fr: "Avancé",
    description_en: "For large organizations with complex needs",
    description_fr: "Pour les grandes organisations aux besoins complexes",
    price_monthly: 99.99,
    price_yearly: 999.99,
    features: [
      { en: "All Pro features", fr: "Toutes les fonctionnalités Pro" },
      { en: "Unlimited projects", fr: "Projets illimités" },
      { en: "1TB storage", fr: "1TB de stockage" },
      { en: "24/7 phone support", fr: "Support téléphonique 24/7" },
      { en: "Custom integrations", fr: "Intégrations personnalisées" },
      { en: "White-label options", fr: "Options de marque blanche" },
      { en: "SLA guarantee", fr: "Garantie SLA" },
      { en: "Dedicated account manager", fr: "Gestionnaire de compte dédié" },
    ],
    quotas: {
      projects: -1,
      storage_gb: 1000,
      api_calls_per_month: -1,
      team_members: -1,
    },
    is_enabled: true,
    is_popular: false,
    sort_order: 3,
  },
]

// Legacy export for backward compatibility
export const HARDCODED_PLANS: SubscriptionPlan[] = HARDCODED_PACKS.map(
  (pack) => ({
    ...pack,
    trial_days: pack.name === "free" ? 0 : 0,
  })
)

/**
 * Fetch subscription packs from database or return hardcoded fallback
 */
export async function getSubscriptionPacks(): Promise<SubscriptionPack[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("subscription_packs")
      .select("*")
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true })

    if (error && error.code !== "PGRST116") {
      return HARDCODED_PACKS
    }

    return data || HARDCODED_PACKS
  } catch (error) {
    return HARDCODED_PACKS
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const packs = await getSubscriptionPacks()
  return packs.map((pack) => ({
    ...pack,
    trial_days: pack.name === "free" ? 0 : 0,
  }))
}

/**
 * Fetch user's current subscription
 */
export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

/**
 * Create or update a subscription for a user
 */
export async function upsertSubscription(
  userId: string,
  packName: "free" | "starter" | "pro" | "advanced",
  status: string = "active"
): Promise<UserSubscription | null> {
  try {
    const supabase = createSupabaseClient()

    const pack = HARDCODED_PACKS.find((p) => p.name === packName)
    if (!pack) {
      throw new Error(`Pack ${packName} not found`)
    }

    const now = new Date()
    const subscriptionData = {
      user_id: userId,
      plan: packName,
      status,
      current_period_start: now.toISOString(),
      current_period_end: null,
      trial_start: null,
      trial_end: null,
      cancel_at_period_end: false,
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .upsert(subscriptionData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    return null
  }
}

/**
 * Calculate yearly discount percentage
 */
export function getYearlyDiscount(
  monthlyPrice: number,
  yearlyPrice: number
): number {
  if (monthlyPrice === 0 || yearlyPrice === 0) return 0
  return Math.round(
    ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100
  )
}

/**
 * Format price for display
 */
export function formatPrice(
  monthly: number,
  yearly: number,
  isYearly: boolean = false
): string {
  const price = isYearly ? yearly / 12 : monthly
  return price === 0 ? "Free" : `$${price.toFixed(2)}`
}

/**
 * Check if a subscription is in trial period
 */
export function isInTrialPeriod(
  subscription: UserSubscription | null
): boolean {
  if (!subscription || subscription.status !== "trial") return false

  if (!subscription.trial_end) return false

  const trialEnd = new Date(subscription.trial_end)
  const now = new Date()

  return now < trialEnd
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(
  subscription: UserSubscription | null
): number {
  if (!isInTrialPeriod(subscription) || !subscription?.trial_end) return 0

  const trialEnd = new Date(subscription.trial_end)
  const now = new Date()
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * Get pack by name
 */
export function getPackByName(packName: string): SubscriptionPack | null {
  return HARDCODED_PACKS.find((pack) => pack.name === packName) || null
}

/**
 * Check if user has access to a feature based on their pack
 */
export function hasFeatureAccess(
  userPack: string | null,
  requiredPack: "free" | "starter" | "pro" | "advanced"
): boolean {
  if (!userPack) return requiredPack === "free"

  const packHierarchy: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    advanced: 3,
  }

  const userLevel = packHierarchy[userPack] ?? 0
  const requiredLevel = packHierarchy[requiredPack] ?? 0

  return userLevel >= requiredLevel
}

/**
 * Check if user can use quota (projects, storage, etc.)
 */
export function canUseQuota(
  userPack: string | null,
  quotaType: keyof SubscriptionPackQuotas,
  currentUsage: number
): boolean {
  const pack = userPack ? getPackByName(userPack) : null
  if (!pack) return false

  const quotaLimit = pack.quotas[quotaType]
  if (quotaLimit === -1) return true // Unlimited

  return currentUsage < quotaLimit
}

/**
 * Get remaining quota for a user
 */
export function getRemainingQuota(
  userPack: string | null,
  quotaType: keyof SubscriptionPackQuotas,
  currentUsage: number
): number {
  const pack = userPack ? getPackByName(userPack) : null
  if (!pack) return 0

  const quotaLimit = pack.quotas[quotaType]
  if (quotaLimit === -1) return -1 // Unlimited

  return Math.max(0, quotaLimit - currentUsage)
}

/**
 * Format quota display text
 */
export function formatQuotaText(quotaValue: number, unit: string = ""): string {
  if (quotaValue === -1) return `Unlimited${unit ? ` ${unit}` : ""}`
  return `${quotaValue}${unit ? ` ${unit}` : ""}`
}

/**
 * Get user's subscription pack details
 */
export async function getUserPackDetails(userId: string): Promise<{
  subscription: UserSubscription | null
  pack: SubscriptionPack | null
}> {
  const subscription = await getUserSubscription(userId)
  const pack = subscription ? getPackByName(subscription.plan) : null

  return { subscription, pack }
}
