"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Globe,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Crown,
  CheckCircle,
  Building,
  DollarSign,
} from "lucide-react"

interface UserWebsite {
  id: string
  url: string
  name: string | null
  business_type: "ecommerce" | "service" | "vitrine"
  target_countries: string[]
  site_languages: string[]
  industry: string | null
  monthly_ads_budget: number | null
  is_primary: boolean
  is_verified: boolean
  created_at: string
}

interface WebsiteQuota {
  user_id: string
  email: string
  plan: string
  websites_used: number
  websites_limit: number
  quota_reached: boolean
}

export function WebsiteManagement() {
  const t = useTranslations("profile.websites")
  const tCommon = useTranslations("common")
  const params = useParams()
  const locale = params.locale as string
  const { showToast, ToastComponent } = useToast()

  const [websites, setWebsites] = useState<UserWebsite[]>([])
  const [quota, setQuota] = useState<WebsiteQuota | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWebsite, setEditingWebsite] = useState<UserWebsite | null>(null)

  const [formData, setFormData] = useState({
    url: "",
    name: "",
    business_type: "",
    target_countries: [] as string[],
    site_languages: [] as string[],
    industry: "",
    monthly_ads_budget: "",
    is_primary: false,
  })

  // Available options
  const businessTypes = [
    { value: "ecommerce", label: t("businessTypes.ecommerce") },
    { value: "service", label: t("businessTypes.service") },
    { value: "vitrine", label: t("businessTypes.vitrine") },
  ]

  const countries = [
    { value: "CA", label: t("countries.CA") },
    { value: "FR", label: t("countries.FR") },
    { value: "US", label: t("countries.US") },
    { value: "BE", label: t("countries.BE") },
    { value: "CH", label: t("countries.CH") },
    { value: "UK", label: t("countries.UK") },
    { value: "DE", label: t("countries.DE") },
    { value: "ES", label: t("countries.ES") },
    { value: "IT", label: t("countries.IT") },
  ]

  const languages = [
    { value: "fr", label: t("languages.fr") },
    { value: "en", label: t("languages.en") },
    { value: "es", label: t("languages.es") },
    { value: "de", label: t("languages.de") },
    { value: "it", label: t("languages.it") },
    { value: "nl", label: t("languages.nl") },
  ]

  // Fetch websites and quota
  const fetchWebsites = useCallback(async () => {
    try {
      const response = await fetch("/api/profile/websites")

      if (!response.ok) {
        throw new Error("Failed to fetch websites")
      }

      const data = await response.json()
      setWebsites(data.websites || [])
      setQuota(data.quota || null)
    } catch (error) {
      console.error("Error fetching websites:", error)
      showToast({
        message: t("websiteError"),
        type: "error",
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }, [t, showToast])

  useEffect(() => {
    fetchWebsites()
  }, [fetchWebsites])

  // Reset form
  const resetForm = () => {
    setFormData({
      url: "",
      name: "",
      business_type: "",
      target_countries: [],
      site_languages: [],
      industry: "",
      monthly_ads_budget: "",
      is_primary: false,
    })
    setEditingWebsite(null)
  }

  // Open dialog for editing
  const openEditDialog = (website: UserWebsite) => {
    setEditingWebsite(website)
    setFormData({
      url: website.url,
      name: website.name || "",
      business_type: website.business_type,
      target_countries: website.target_countries,
      site_languages: website.site_languages,
      industry: website.industry || "",
      monthly_ads_budget: website.monthly_ads_budget?.toString() || "",
      is_primary: website.is_primary,
    })
    setIsDialogOpen(true)
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (
      !formData.url ||
      !formData.business_type ||
      formData.target_countries.length === 0 ||
      formData.site_languages.length === 0
    ) {
      showToast({
        message: t("websiteError"),
        type: "error",
        duration: 4000,
      })
      return
    }

    setSubmitting(true)

    try {
      // Parse and validate budget
      let budget = null
      if (
        formData.monthly_ads_budget &&
        formData.monthly_ads_budget.trim() !== ""
      ) {
        const parsedBudget = parseFloat(formData.monthly_ads_budget)
        if (isNaN(parsedBudget) || parsedBudget < 0) {
          showToast({
            message: "Budget must be a valid positive number",
            type: "error",
            duration: 4000,
          })
          return
        }
        budget = parsedBudget
      }

      const submitData = {
        url: formData.url.trim(),
        name: formData.name.trim() || null,
        business_type: formData.business_type,
        target_countries: formData.target_countries,
        site_languages: formData.site_languages,
        industry: formData.industry.trim() || null,
        monthly_ads_budget: budget,
        is_primary: formData.is_primary,
      }

      console.log("Submitting website data:", submitData)

      const response = await fetch(
        editingWebsite
          ? `/api/profile/websites/${editingWebsite.id}`
          : "/api/profile/websites",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submitData),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error Details:", errorData)

        // Handle validation errors specifically
        if (response.status === 400 && errorData.details) {
          const validationErrors = errorData.details
            .map((detail: any) => detail.message)
            .join(", ")
          throw new Error(`Validation failed: ${validationErrors}`)
        }

        throw new Error(errorData.error || "Failed to save website")
      }

      showToast({
        message: editingWebsite ? t("websiteUpdated") : t("websiteAdded"),
        type: "success",
        duration: 3000,
      })

      setIsDialogOpen(false)
      resetForm()
      await fetchWebsites() // Refresh the list
    } catch (error: any) {
      console.error("Error saving website:", error)
      showToast({
        message: error.message || t("websiteError"),
        type: "error",
        duration: 4000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async (websiteId: string) => {
    if (
      !confirm(
        locale === "fr"
          ? "Êtes-vous sûr de vouloir supprimer ce site ?"
          : "Are you sure you want to delete this website?"
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/profile/websites/${websiteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete website")
      }

      showToast({
        message: t("websiteDeleted"),
        type: "success",
        duration: 3000,
      })

      await fetchWebsites() // Refresh the list
    } catch (error) {
      console.error("Error deleting website:", error)
      showToast({
        message: t("websiteError"),
        type: "error",
        duration: 4000,
      })
    }
  }

  // Handle checkbox changes
  const handleCountryChange = (country: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        target_countries: [...formData.target_countries, country],
      })
    } else {
      setFormData({
        ...formData,
        target_countries: formData.target_countries.filter(
          (c) => c !== country
        ),
      })
    }
  }

  const handleLanguageChange = (language: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        site_languages: [...formData.site_languages, language],
      })
    } else {
      setFormData({
        ...formData,
        site_languages: formData.site_languages.filter((l) => l !== language),
      })
    }
  }

  if (loading) {
    return (
      <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
        <CardContent className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Globe className="h-5 w-5 text-violet-600" />
                {t("title")}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                {quota && (
                  <span>
                    {quota.websites_used}/
                    {quota.websites_limit === 5 ? "∞" : quota.websites_limit}{" "}
                    sites utilisés
                  </span>
                )}
              </CardDescription>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={quota?.quota_reached}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 disabled:opacity-50"
                  onClick={resetForm}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addWebsite")}
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingWebsite ? t("editWebsite") : t("addWebsite")}
                  </DialogTitle>
                  <DialogDescription>
                    {editingWebsite
                      ? "Modifiez les informations de votre site"
                      : "Ajoutez les informations de votre site"}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">{t("websiteUrl")} *</Label>
                      <Input
                        id="url"
                        value={formData.url}
                        onChange={(e) =>
                          setFormData({ ...formData, url: e.target.value })
                        }
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">{t("websiteName")}</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Mon Site Web"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("businessType")} *</Label>
                      <Select
                        value={formData.business_type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, business_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">{t("industry")}</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) =>
                          setFormData({ ...formData, industry: e.target.value })
                        }
                        placeholder="Immobilier, Tech, etc."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("targetCountries")} *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {countries.map((country) => (
                        <div
                          key={country.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`country-${country.value}`}
                            checked={formData.target_countries.includes(
                              country.value
                            )}
                            onCheckedChange={(checked) =>
                              handleCountryChange(
                                country.value,
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor={`country-${country.value}`}
                            className="text-sm"
                          >
                            {country.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("siteLanguages")} *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {languages.map((language) => (
                        <div
                          key={language.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`lang-${language.value}`}
                            checked={formData.site_languages.includes(
                              language.value
                            )}
                            onCheckedChange={(checked) =>
                              handleLanguageChange(
                                language.value,
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor={`lang-${language.value}`}
                            className="text-sm"
                          >
                            {language.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">{t("monthlyBudget")}</Label>
                      <Input
                        id="budget"
                        type="number"
                        min="0"
                        value={formData.monthly_ads_budget}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            monthly_ads_budget: e.target.value,
                          })
                        }
                        placeholder="500"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="is_primary"
                        checked={formData.is_primary}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            is_primary: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="is_primary">{t("isPrimary")}</Label>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      resetForm()
                    }}
                  >
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700"
                  >
                    {submitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {tCommon("loading")}...
                      </>
                    ) : (
                      tCommon("save")
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {quota?.quota_reached && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800 dark:text-amber-200">
                {t("quotaReached")}
              </span>
              <Button
                size="sm"
                variant="link"
                className="ml-auto text-amber-600"
              >
                {t("upgradeToAddMore")}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {websites.length === 0 ? (
            <div className="py-8 text-center">
              <Globe className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-4 text-gray-500">{t("noWebsites")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {websites.map((website) => (
                <div
                  key={website.id}
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {website.name || website.url}
                        </h3>
                        {website.is_primary && (
                          <Badge
                            variant="secondary"
                            className="bg-violet-100 text-violet-800"
                          >
                            {t("isPrimary")}
                          </Badge>
                        )}
                        {website.is_verified && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <ExternalLink className="h-3 w-3" />
                        <a
                          href={website.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-violet-600"
                        >
                          {website.url}
                        </a>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Building className="h-3 w-3" />
                          {t(`businessTypes.${website.business_type}`)}
                        </div>

                        {website.monthly_ads_budget && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <DollarSign className="h-3 w-3" />
                            {website.monthly_ads_budget}€/mois
                          </div>
                        )}

                        <div className="text-xs text-gray-600">
                          {website.target_countries.length} pays •{" "}
                          {website.site_languages.length} langues
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(website)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(website.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {ToastComponent}
    </>
  )
}
