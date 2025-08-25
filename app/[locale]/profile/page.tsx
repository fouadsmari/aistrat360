"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Save,
  User,
  Globe,
  Phone,
  Building2,
  MapPin,
  Map,
  Crown,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  avatar_url: string | null
  role: string
  preferred_language: string
  phone: string | null
  company: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  country: string | null
}

interface UserSubscription {
  id: string
  plan: string
  status: string
  current_period_start: string
  current_period_end: string
  trial_end: string | null
  cancel_at_period_end: boolean
}

export default function ProfilePage() {
  const t = useTranslations("profile")
  const tSubscription = useTranslations("subscription")
  const tCommon = useTranslations("common")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { showToast, ToastComponent } = useToast()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    full_name: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
    preferred_language: locale,
  })

  const fetchProfile = useCallback(async () => {
    try {
      const supabase = createSupabaseClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push(`/${locale}/login`)
        return
      }

      const [
        { data: profileData, error },
        { data: subscriptionData, error: subError },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single(),
      ])

      // Handle subscription data
      if (subError && subError.code !== "PGRST116") {
        console.error("Error fetching subscription:", subError)
        setSubscription(null)
      } else {
        setSubscription(subscriptionData)
      }

      if (error) {
        // If profile doesn't exist, show a basic profile
        // The profile should be created automatically by the database trigger
        console.error("Profile not found, using default:", error)
        setProfile({
          id: user.id,
          email: user.email || "",
          first_name: null,
          last_name: null,
          full_name: null,
          avatar_url: null,
          role: "subscriber",
          preferred_language: locale,
          phone: null,
          company: null,
          address: null,
          city: null,
          postal_code: null,
          country: null,
        })
        setFormData({
          first_name: "",
          last_name: "",
          full_name: "",
          phone: "",
          company: "",
          address: "",
          city: "",
          postal_code: "",
          country: "",
          preferred_language: locale,
        })
      } else {
        setProfile(profileData)
        setFormData({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          company: profileData.company || "",
          address: profileData.address || "",
          city: profileData.city || "",
          postal_code: profileData.postal_code || "",
          country: profileData.country || "",
          preferred_language: profileData.preferred_language || locale,
        })
      }
    } catch (error) {
      console.error("Error:", error)
      // Show basic profile even if error
      setProfile({
        id: "temp",
        email: "user@example.com",
        first_name: null,
        last_name: null,
        full_name: null,
        avatar_url: null,
        role: "subscriber",
        preferred_language: locale,
        phone: null,
        company: null,
        address: null,
        city: null,
        postal_code: null,
        country: null,
      })
    } finally {
      setLoading(false)
    }
  }, [locale, router])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const supabase = createSupabaseClient()

      // Use upsert to create or update the profile
      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .upsert({
          id: profile.id,
          email: profile.email,
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          company: formData.company || null,
          address: formData.address || null,
          city: formData.city || null,
          postal_code: formData.postal_code || null,
          country: formData.country || null,
          preferred_language: formData.preferred_language,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Error updating profile:", error)
        showToast({
          message: t("updateError"),
          type: "error",
          duration: 4000,
        })
        setSaving(false)
        return
      }

      // Update local state with the returned data
      if (updatedProfile) {
        setProfile(updatedProfile)
        setFormData({
          first_name: updatedProfile.first_name || "",
          last_name: updatedProfile.last_name || "",
          full_name: updatedProfile.full_name || "",
          phone: updatedProfile.phone || "",
          company: updatedProfile.company || "",
          address: updatedProfile.address || "",
          city: updatedProfile.city || "",
          postal_code: updatedProfile.postal_code || "",
          country: updatedProfile.country || "",
          preferred_language: updatedProfile.preferred_language || locale,
        })
      }

      // Show success feedback
      showToast({
        message: t("updateSuccess"),
        type: "success",
        duration: 3000,
      })

      // If language changed, redirect to new locale after a short delay
      if (formData.preferred_language !== locale) {
        setTimeout(() => {
          const currentPath = window.location.pathname
          const newPath = currentPath.replace(
            `/${locale}`,
            `/${formData.preferred_language}`
          )
          window.location.href = newPath
        }, 500)
      }
    } catch (error) {
      console.error("Error:", error)
      showToast({
        message: t("updateError"),
        type: "error",
        duration: 4000,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">{tCommon("loading")}</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-gray-500">{tCommon("error")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          {t("title")}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {t("personalInfo")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscription Card */}
        <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Crown className="h-5 w-5 text-violet-600" />
              {tSubscription("title")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {tSubscription("currentPlan")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plan:
                  </span>
                  <span className="rounded-full bg-violet-100 px-2 py-1 text-sm font-medium text-violet-800 dark:bg-violet-900 dark:text-violet-200">
                    {tSubscription(`plans.${subscription.plan}`)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status:
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-sm font-medium ${
                      subscription.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : subscription.status === "trial"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {tSubscription(`status.${subscription.status}`)}
                  </span>
                </div>

                {subscription.status === "trial" && subscription.trial_end && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Trial ends:
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(subscription.trial_end).toLocaleDateString(
                        locale === "fr" ? "fr-FR" : "en-US"
                      )}
                    </span>
                  </div>
                )}

                {subscription.status === "active" &&
                  subscription.current_period_end && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {tSubscription("nextBilling")}:
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(
                          subscription.current_period_end
                        ).toLocaleDateString(
                          locale === "fr" ? "fr-FR" : "en-US"
                        )}
                      </span>
                    </div>
                  )}

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => router.push(`/${locale}/pricing`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {subscription.status === "trial"
                    ? tSubscription("upgrade")
                    : "Manage Plan"}
                </Button>
              </>
            ) : (
              <>
                <div className="py-4 text-center">
                  <Crown className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                  <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    No active subscription
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700"
                    onClick={() => router.push(`/${locale}/pricing`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Plans
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {t("personalInfo")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {t("updateProfile")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {locale === "fr" ? "Prénom" : "First Name"}
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {locale === "fr" ? "Nom" : "Last Name"}
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="border-gray-300/50 bg-gray-50 text-gray-500 dark:border-gray-700/50 dark:bg-gray-800 dark:text-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {locale === "fr"
                    ? "L'email ne peut pas être modifié pour des raisons de sécurité"
                    : "Email cannot be changed for security reasons"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t("phone")}
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {t("company")}
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {locale === "fr" ? "Adresse" : "Address"}
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  {locale === "fr" ? "Ville" : "City"}
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="postal_code"
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {locale === "fr" ? "Code postal" : "Postal Code"}
                </Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, postal_code: e.target.value })
                  }
                  className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {locale === "fr" ? "Pays" : "Country"}
                </Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t("preferences")}
              </h3>

              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t("language")}
                </Label>
                <Select
                  value={formData.preferred_language}
                  onValueChange={(value) =>
                    setFormData({ ...formData, preferred_language: value })
                  }
                >
                  <SelectTrigger className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700"
              >
                {saving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {tCommon("loading")}...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("updateProfile")}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {ToastComponent}
    </div>
  )
}
