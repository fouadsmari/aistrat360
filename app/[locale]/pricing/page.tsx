"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Check,
  Star,
  Zap,
  Shield,
  Users,
  Rocket,
  Crown,
  Sparkles,
} from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import {
  getSubscriptionPlans,
  getUserSubscription,
  upsertSubscription,
  getYearlyDiscount,
  formatPrice,
  type SubscriptionPlan,
  type UserSubscription,
} from "@/lib/subscription-utils"

export default function PricingPage() {
  const t = useTranslations("pricing")
  const tCommon = useTranslations("common")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { showToast, ToastComponent } = useToast()

  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [isYearly, setIsYearly] = useState(false)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)

  const fetchPlansAndSubscription = async () => {
    try {
      const supabase = createSupabaseClient()

      // Get plans (always available)
      const plans = await getSubscriptionPlans()
      setPlans(plans.sort((a, b) => a.sort_order - b.sort_order))

      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setCurrentSubscription(null)
        setLoading(false)
        return
      }

      // Get user subscription if authenticated
      const subscription = await getUserSubscription(user.id)
      setCurrentSubscription(subscription)
    } catch (error) {
      showToast({
        message: tCommon("error"),
        type: "error",
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlansAndSubscription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    setProcessingPlan(plan.name)
    try {
      const supabase = createSupabaseClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        // Redirect to login if not authenticated
        router.push(
          `/${locale}/login?redirect=${encodeURIComponent(`/${locale}/pricing`)}`
        )
        return
      }

      // Here you would typically integrate with a payment processor like Stripe
      // For now, we'll just update the subscription in the database directly

      if (plan.name === "trial") {
        // Handle trial signup
        const subscription = await upsertSubscription(
          user.id,
          plan.name,
          "trial"
        )

        if (!subscription) {
          throw new Error("Failed to create trial subscription")
        }

        showToast({
          message: `${t("freeTrial")} started!`,
          type: "success",
          duration: 4000,
        })

        // Refresh the data
        fetchPlansAndSubscription()
      } else {
        // For paid plans, you would redirect to payment processor
        // For demo purposes, we'll show a message
        showToast({
          message: `Redirecting to payment for ${locale === "fr" ? plan.display_name_fr : plan.display_name_en}...`,
          type: "info",
          duration: 4000,
        })

        // In a real implementation, you would:
        // 1. Create a Stripe checkout session
        // 2. Redirect to Stripe
        // 3. Handle the webhook to update subscription
      }
    } catch (error) {
      console.error("Error selecting plan:", error)
      showToast({
        message: tCommon("error"),
        type: "error",
        duration: 4000,
      })
    } finally {
      setProcessingPlan(null)
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "trial":
        return <Sparkles className="h-6 w-6" />
      case "starter":
        return <Zap className="h-6 w-6" />
      case "pro":
        return <Rocket className="h-6 w-6" />
      case "advanced":
        return <Crown className="h-6 w-6" />
      default:
        return <Shield className="h-6 w-6" />
    }
  }

  const getButtonText = (plan: SubscriptionPlan) => {
    if (currentSubscription?.plan === plan.name) {
      return t("currentPlan")
    }

    if (plan.name === "trial") {
      return t("startTrial")
    }

    if (plan.name === "advanced") {
      return t("contactSales")
    }

    return t("selectPlan")
  }

  const getButtonVariant = (plan: SubscriptionPlan) => {
    if (currentSubscription?.plan === plan.name) {
      return "secondary" as const
    }

    if (plan.is_popular) {
      return "default" as const
    }

    return "outline" as const
  }

  const isCurrentPlan = (planName: string) => {
    return currentSubscription?.plan === planName
  }

  const formatPriceDisplay = (monthly: number, yearly: number) => {
    return formatPrice(monthly, yearly, isYearly)
  }

  const getDiscountPercent = (monthly: number, yearly: number) => {
    return getYearlyDiscount(monthly, yearly)
  }

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">{tCommon("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
          {t("title")}
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
          {t("subtitle")}
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            onClick={() => setIsYearly(false)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              !isYearly
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            {t("monthlyBilling")}
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              isYearly
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            {t("yearlyBilling")}
            {plans.some(
              (p) => getDiscountPercent(p.price_monthly, p.price_yearly) > 0
            ) && (
              <Badge
                variant="secondary"
                className="ml-2 bg-green-100 text-green-800"
              >
                {t("save", { percent: "17" })}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const yearlyDiscount = getDiscountPercent(
            plan.price_monthly,
            plan.price_yearly
          )
          const displayName =
            locale === "fr" ? plan.display_name_fr : plan.display_name_en
          const description =
            locale === "fr" ? plan.description_fr : plan.description_en

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative border-2 transition-all duration-300 hover:shadow-lg",
                plan.is_popular
                  ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/20"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
                isCurrentPlan(plan.name) &&
                  "ring-2 ring-green-500 ring-offset-2"
              )}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                    <Star className="mr-1 h-3 w-3" />
                    {t("popular")}
                  </Badge>
                </div>
              )}

              {isCurrentPlan(plan.name) && (
                <div className="absolute -top-3 right-4">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    {t("currentPlan")}
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <div
                    className={cn(
                      "rounded-lg p-2",
                      plan.is_popular
                        ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    )}
                  >
                    {getPlanIcon(plan.name)}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{displayName}</CardTitle>
                    <CardDescription className="text-sm">
                      {description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-6">
                <div className="mb-6">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-bold">
                      {formatPriceDisplay(
                        plan.price_monthly,
                        plan.price_yearly
                      )}
                    </span>
                    {plan.price_monthly > 0 && (
                      <span className="text-gray-500">
                        {isYearly ? t("perMonth") : t("perMonth")}
                      </span>
                    )}
                  </div>
                  {plan.price_monthly > 0 && (
                    <p className="text-sm text-gray-500">
                      {isYearly ? t("billedYearly") : t("billedMonthly")}
                    </p>
                  )}
                  {isYearly && yearlyDiscount > 0 && (
                    <Badge
                      variant="secondary"
                      className="mt-2 bg-green-100 text-green-800"
                    >
                      {t("save", { percent: yearlyDiscount.toString() })}
                    </Badge>
                  )}
                </div>

                <Separator className="mb-6" />

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {locale === "fr" ? feature.fr : feature.en}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={
                    isCurrentPlan(plan.name) || processingPlan === plan.name
                  }
                  variant={getButtonVariant(plan)}
                  className={cn(
                    "w-full",
                    plan.is_popular &&
                      !isCurrentPlan(plan.name) &&
                      "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700"
                  )}
                >
                  {processingPlan === plan.name ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {tCommon("loading")}...
                    </>
                  ) : (
                    getButtonText(plan)
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Features */}
      <div className="space-y-4 text-center">
        <div className="flex justify-center space-x-8 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-600" />
            <span>{t("freeTrial")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-600" />
            <span>{t("noCommitment")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-600" />
            <span>{t("allFeatures")}</span>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t("faq.title")}
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t("faq.canIChangeAnytime")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("faq.changeAnytimeAnswer")}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">{t("faq.freeTrial")}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("faq.freeTrialAnswer")}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t("faq.cancelAnytime")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("faq.cancelAnytimeAnswer")}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t("faq.whatPaymentMethods")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("faq.paymentMethodsAnswer")}
            </p>
          </div>
        </div>
      </div>

      {ToastComponent}
    </div>
  )
}
