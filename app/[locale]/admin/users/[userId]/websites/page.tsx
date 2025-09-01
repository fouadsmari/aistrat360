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
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  Building,
  DollarSign,
  ArrowLeft,
  Shield,
  Users,
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
  profiles: {
    email: string
    full_name: string | null
  }
}

export default function UserWebsitesAdminPage() {
  const t = useTranslations("profile.websites")
  const tCommon = useTranslations("common")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const userId = params.userId as string
  const { showToast, ToastComponent } = useToast()

  const [websites, setWebsites] = useState<UserWebsite[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWebsite, setEditingWebsite] = useState<UserWebsite | null>(null)
  const [userInfo, setUserInfo] = useState<{
    email: string
    full_name: string | null
  } | null>(null)

  const [formData, setFormData] = useState({
    url: "",
    name: "",
    business_type: "",
    target_countries: [] as string[],
    site_languages: [] as string[],
    industry: "",
    monthly_ads_budget: "",
    is_primary: false,
    is_verified: false,
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

  // Fetch websites for specific user
  const fetchWebsites = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/websites?user_id=${userId}`)

      if (!response.ok) {
        if (response.status === 403) {
          router.push(`/${locale}/admin/users`)
          return
        }
        throw new Error("Failed to fetch websites")
      }

      const data = await response.json()
      setWebsites(data.websites || [])

      // Set user info from first website if available
      if (data.websites && data.websites.length > 0) {
        setUserInfo(data.websites[0].profiles)
      }
    } catch (error) {
      console.error("Error fetching websites:", error)
      showToast({
        message: "Erreur lors du chargement des sites web",
        type: "error",
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }, [userId, router, locale, showToast])

  useEffect(() => {
    fetchWebsites()
  }, [userId, fetchWebsites])

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
      is_verified: false,
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
      is_verified: website.is_verified,
    })
    setIsDialogOpen(true)
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!editingWebsite) return

    setSubmitting(true)

    try {
      const submitData = {
        ...formData,
        monthly_ads_budget: formData.monthly_ads_budget
          ? parseFloat(formData.monthly_ads_budget)
          : null,
        name: formData.name || null,
        industry: formData.industry || null,
      }

      const response = await fetch(`/api/admin/websites/${editingWebsite.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update website")
      }

      showToast({
        message: "Site web mis à jour avec succès",
        type: "success",
        duration: 3000,
      })

      setIsDialogOpen(false)
      resetForm()
      await fetchWebsites() // Refresh the list
    } catch (error: any) {
      console.error("Error updating website:", error)
      showToast({
        message: error.message || "Erreur lors de la mise à jour",
        type: "error",
        duration: 4000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async (websiteId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce site web ?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/websites/${websiteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete website")
      }

      showToast({
        message: "Site web supprimé avec succès",
        type: "success",
        duration: 3000,
      })

      await fetchWebsites() // Refresh the list
    } catch (error) {
      console.error("Error deleting website:", error)
      showToast({
        message: "Erreur lors de la suppression",
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
            <p className="mt-2 text-sm text-gray-500">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                <Users className="mr-2 inline h-8 w-8 text-red-600" />
                Sites Web -{" "}
                {userInfo?.full_name || userInfo?.email || "Utilisateur"}
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Gestion des sites web de l&apos;utilisateur
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Websites Card */}
      <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Globe className="h-5 w-5 text-violet-600" />
            Sites Web ({websites.length})
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Gérer les sites web de cet utilisateur
          </CardDescription>
        </CardHeader>

        <CardContent>
          {websites.length === 0 ? (
            <div className="py-8 text-center">
              <Globe className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-4 text-gray-500">Aucun site web configuré</p>
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
                            Principal
                          </Badge>
                        )}
                        {website.is_verified && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {!website.is_verified && (
                          <Shield className="h-4 w-4 text-amber-500" />
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

                        <div className="text-xs text-gray-500">
                          Créé le{" "}
                          {new Date(website.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(website)}
                        className="text-violet-600 hover:bg-violet-50"
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

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le site web</DialogTitle>
            <DialogDescription>
              Modifiez les informations du site web de l&apos;utilisateur
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL du site *</Label>
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
                <Label htmlFor="name">Nom du site</Label>
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
                <Label>Type d&apos;entreprise *</Label>
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
                <Label htmlFor="industry">Secteur d&apos;activité</Label>
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
              <Label>Pays ciblés *</Label>
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
                        handleCountryChange(country.value, checked as boolean)
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
              <Label>Langues du site *</Label>
              <div className="grid grid-cols-3 gap-2">
                {languages.map((language) => (
                  <div
                    key={language.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`lang-${language.value}`}
                      checked={formData.site_languages.includes(language.value)}
                      onCheckedChange={(checked) =>
                        handleLanguageChange(language.value, checked as boolean)
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
                <Label htmlFor="budget">Budget mensuel Google Ads</Label>
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

              <div className="space-y-2 pt-6">
                <div className="flex items-center space-x-2">
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
                  <Label htmlFor="is_primary">Site principal</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_verified"
                    checked={formData.is_verified}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        is_verified: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="is_verified">Site vérifié</Label>
                </div>
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
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700"
            >
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Mise à jour...
                </>
              ) : (
                "Mettre à jour"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {ToastComponent}
    </div>
  )
}
