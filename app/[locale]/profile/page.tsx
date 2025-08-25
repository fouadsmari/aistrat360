"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Camera, Save, User, Globe, Phone, Building2 } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  preferred_language: string
  phone: string | null
  company: string | null
}

export default function ProfilePage() {
  const t = useTranslations("profile")
  const tCommon = useTranslations("common")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    company: "",
    preferred_language: locale,
  })

  const fetchProfile = useCallback(async () => {
    try {
      const supabase = createSupabaseClient()
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push(`/${locale}/login`)
        return
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) {
        // If profile doesn't exist, create a basic profile
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || "",
            preferred_language: locale,
            role: "subscriber",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error("Error creating profile:", createError)
          setProfile({
            id: user.id,
            email: user.email || "",
            full_name: null,
            avatar_url: null,
            role: "subscriber",
            preferred_language: locale,
            phone: null,
            company: null
          })
        } else {
          setProfile(newProfile)
          setFormData({
            full_name: newProfile.full_name || "",
            phone: newProfile.phone || "",
            company: newProfile.company || "",
            preferred_language: newProfile.preferred_language || locale,
          })
        }
      } else {
        setProfile(profileData)
        setFormData({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          company: profileData.company || "",
          preferred_language: profileData.preferred_language || locale,
        })
      }
    } catch (error) {
      console.error("Error:", error)
      // Show basic profile even if error
      setProfile({
        id: "temp",
        email: "user@example.com",
        full_name: null,
        avatar_url: null,
        role: "subscriber",
        preferred_language: locale,
        phone: null,
        company: null
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
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          company: formData.company,
          preferred_language: formData.preferred_language,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) {
        console.error("Error updating profile:", error)
        return
      }

      // If language changed, redirect to new locale
      if (formData.preferred_language !== locale) {
        const currentPath = window.location.pathname
        const newPath = currentPath.replace(
          `/${locale}`,
          `/${formData.preferred_language}`
        )
        window.location.href = newPath
        return
      }

      // Refresh profile data
      await fetchProfile()
    } catch (error) {
      console.error("Error:", error)
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Picture Card */}
        <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {t("avatar")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {t("changeAvatar")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="relative mx-auto mb-4 h-24 w-24">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={profile.avatar_url || ""}
                  alt={profile.full_name || ""}
                />
                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-2xl text-white">
                  {profile.full_name?.charAt(0) ||
                    profile.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -right-1 rounded-full bg-violet-600 p-2 text-white shadow-lg hover:bg-violet-700">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <Button variant="outline" size="sm">
              {t("changeAvatar")}
            </Button>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="col-span-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
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
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("fullName")}
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
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
                  className="border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                />
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
    </div>
  )
}
