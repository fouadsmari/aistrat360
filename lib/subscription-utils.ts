import { createSupabaseClient } from "./supabase"

export interface SubscriptionPlan {
  id: string
  name: string
  display_name_en: string
  display_name_fr: string
  description_en: string
  description_fr: string
  price_monthly: number
  price_yearly: number
  features: Array<{ en: string; fr: string }>
  is_enabled: boolean
  is_popular: boolean
  sort_order: number
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

export const HARDCODED_PLANS: SubscriptionPlan[] = [
  {
    id: "trial",
    name: "trial",
    display_name_en: "Trial",
    display_name_fr: "Essai",
    description_en: "Try our platform for free",
    description_fr: "Essayez notre plateforme gratuitement",
    price_monthly: 0,
    price_yearly: 0,
    features: [
      { en: "Access to basic features", fr: "Accès aux fonctionnalités de base" },
      { en: "1 project", fr: "1 projet" },
      { en: "Email support", fr: "Support par email" },
      { en: "14-day trial", fr: "14 jours d'essai" }
    ],
    is_enabled: true,
    is_popular: false,
    sort_order: 0,
    trial_days: 14
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
      { en: "Mobile app access", fr: "Accès à l'application mobile" }
    ],
    is_enabled: true,
    is_popular: false,
    sort_order: 1,
    trial_days: 0
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
      { en: "API access", fr: "Accès API" }
    ],
    is_enabled: true,
    is_popular: true,
    sort_order: 2,
    trial_days: 0
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
      { en: "Dedicated account manager", fr: "Gestionnaire de compte dédié" }
    ],
    is_enabled: true,
    is_popular: false,
    sort_order: 3,
    trial_days: 0
  }
]

/**
 * Fetch subscription plans from database or return hardcoded fallback
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true })

    if (error && error.code !== 'PGRST116') {
      console.warn("Database not available, using hardcoded plans:", error)
      return HARDCODED_PLANS
    }

    return data || HARDCODED_PLANS
  } catch (error) {
    console.warn("Error fetching plans, using hardcoded fallback:", error)
    return HARDCODED_PLANS
  }
}

/**
 * Fetch user's current subscription
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.warn("Error fetching user subscription:", error)
      return null
    }

    return data
  } catch (error) {
    console.warn("Error fetching user subscription:", error)
    return null
  }
}

/**
 * Create or update a subscription for a user
 */
export async function upsertSubscription(
  userId: string, 
  planName: string, 
  status: string = "trial"
): Promise<UserSubscription | null> {
  try {
    const supabase = createSupabaseClient()
    
    const plan = HARDCODED_PLANS.find(p => p.name === planName)
    if (!plan) {
      throw new Error(`Plan ${planName} not found`)
    }

    const now = new Date()
    let trialEnd: Date | null = null
    let periodEnd: Date | null = null

    if (status === "trial" && plan.trial_days > 0) {
      trialEnd = new Date(now)
      trialEnd.setDate(trialEnd.getDate() + plan.trial_days)
      periodEnd = trialEnd
    }

    const subscriptionData = {
      user_id: userId,
      plan: planName,
      status,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd?.toISOString() || null,
      trial_start: status === "trial" ? now.toISOString() : null,
      trial_end: trialEnd?.toISOString() || null,
      cancel_at_period_end: false
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
    console.error("Error upserting subscription:", error)
    return null
  }
}

/**
 * Calculate yearly discount percentage
 */
export function getYearlyDiscount(monthlyPrice: number, yearlyPrice: number): number {
  if (monthlyPrice === 0 || yearlyPrice === 0) return 0
  return Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100)
}

/**
 * Format price for display
 */
export function formatPrice(monthly: number, yearly: number, isYearly: boolean = false): string {
  const price = isYearly ? yearly / 12 : monthly
  return price === 0 ? "Free" : `$${price.toFixed(2)}`
}

/**
 * Check if a subscription is in trial period
 */
export function isInTrialPeriod(subscription: UserSubscription | null): boolean {
  if (!subscription || subscription.status !== "trial") return false
  
  if (!subscription.trial_end) return false
  
  const trialEnd = new Date(subscription.trial_end)
  const now = new Date()
  
  return now < trialEnd
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(subscription: UserSubscription | null): number {
  if (!isInTrialPeriod(subscription) || !subscription?.trial_end) return 0
  
  const trialEnd = new Date(subscription.trial_end)
  const now = new Date()
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}