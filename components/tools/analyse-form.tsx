"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Globe, DollarSign, Target } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const formSchema = z.object({
  websiteUrl: z.string().url("Please enter a valid URL"),
  budget: z
    .number()
    .min(100, "Budget must be at least €100")
    .max(100000, "Budget cannot exceed €100,000"),
  objective: z.enum(["leads", "sales", "traffic", "awareness"]),
  targetCountry: z.enum([
    "CA",
    "US",
    "FR",
    "BE",
    "CH",
    "GB",
    "DE",
    "ES",
    "IT",
    "NL",
  ]),
  keywords: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface AnalyseFormProps {
  userQuota: {
    remaining: number
    isUnlimited: boolean
  }
}

export function AnalyseForm({ userQuota }: AnalyseFormProps) {
  const t = useTranslations("tools.analyse")
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      websiteUrl: "",
      budget: 1000,
      objective: "leads",
      targetCountry: "FR",
      keywords: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    console.log("🚀 CLIENT: Form submission started", data)

    if (!userQuota.isUnlimited && userQuota.remaining <= 0) {
      console.log("❌ CLIENT: Quota exceeded", {
        remaining: userQuota.remaining,
        isUnlimited: userQuota.isUnlimited,
      })
      // TODO: Show upgrade modal
      return
    }

    console.log("✅ CLIENT: Quota OK, starting analysis", {
      remaining: userQuota.remaining,
      isUnlimited: userQuota.isUnlimited,
    })
    setIsSubmitting(true)
    setProgress(0)

    try {
      console.log("📡 CLIENT: Making API call to /api/tools/analyse...")

      // Make API call to start analysis FIRST
      const response = await fetch("/api/tools/analyse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      console.log("📥 CLIENT: API response received", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ CLIENT: API success, got result", result)

        const analysisId = result.analysisId

        // Check if analysis completed immediately (synchronous processing)
        if (result.status === "completed") {
          console.log(
            "🎉 CLIENT: Analysis completed immediately, redirecting..."
          )
          setProgress(100)
          router.push(`/tools/analyse/${analysisId}`)
          return
        }

        // If not completed, start polling for progress
        console.log(
          "🔄 CLIENT: Starting progress polling for analysis",
          analysisId
        )

        const pollProgress = async () => {
          try {
            const statusResponse = await fetch(
              `/api/tools/analyse?id=${analysisId}`
            )
            if (statusResponse.ok) {
              const status = await statusResponse.json()
              console.log("📊 CLIENT: Progress update", status)

              setProgress(status.progress || 0)

              if (status.status === "completed") {
                console.log("🎉 CLIENT: Analysis completed, redirecting...")
                router.push(`/tools/analyse/${analysisId}`)
                return
              } else if (status.status === "failed") {
                console.error("❌ CLIENT: Analysis failed", status)
                throw new Error("Analysis failed")
              }

              // Continue polling if still processing
              if (
                status.status === "processing" ||
                status.status === "pending"
              ) {
                setTimeout(pollProgress, 2000) // Poll every 2 seconds
              }
            }
          } catch (error) {
            console.error("❌ CLIENT: Polling error", error)
          }
        }

        // Start polling
        setTimeout(pollProgress, 1000)
      } else {
        const errorText = await response.text()
        console.error("❌ CLIENT: API error response", errorText)
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error("❌ CLIENT: Analysis error:", error)
      setIsSubmitting(false)
      setProgress(0)
      // TODO: Show error toast
    }
  }

  const canSubmit = userQuota.isUnlimited || userQuota.remaining > 0

  return (
    <div className="space-y-6">
      {/* Quota Display */}
      <Card className="border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-900/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <span className="font-medium text-violet-800 dark:text-violet-200">
                {t("quota.remaining")}
              </span>
            </div>
            <Badge variant={canSubmit ? "default" : "destructive"}>
              {userQuota.isUnlimited
                ? t("quota.unlimited")
                : userQuota.remaining}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("form.website_url")}
          </CardTitle>
          <CardDescription>{t("form.website_url_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Website URL */}
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.website_url")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("form.website_url_placeholder")}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.website_url_description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                {/* Budget */}
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {t("form.budget")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={t("form.budget_placeholder")}
                          {...field}
                          onChange={(e) => field.onChange(+e.target.value)}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("form.budget_description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Objective */}
                <FormField
                  control={form.control}
                  name="objective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.objective")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select objective" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="leads">
                            {t("objectives.leads")}
                          </SelectItem>
                          <SelectItem value="sales">
                            {t("objectives.sales")}
                          </SelectItem>
                          <SelectItem value="traffic">
                            {t("objectives.traffic")}
                          </SelectItem>
                          <SelectItem value="awareness">
                            {t("objectives.awareness")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("form.objective_description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target Country */}
                <FormField
                  control={form.control}
                  name="targetCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Marché cible
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un pays" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                          <SelectItem value="US">🇺🇸 États-Unis</SelectItem>
                          <SelectItem value="FR">🇫🇷 France</SelectItem>
                          <SelectItem value="BE">🇧🇪 Belgique</SelectItem>
                          <SelectItem value="CH">🇨🇭 Suisse</SelectItem>
                          <SelectItem value="GB">🇬🇧 Royaume-Uni</SelectItem>
                          <SelectItem value="DE">🇩🇪 Allemagne</SelectItem>
                          <SelectItem value="ES">🇪🇸 Espagne</SelectItem>
                          <SelectItem value="IT">🇮🇹 Italie</SelectItem>
                          <SelectItem value="NL">🇳🇱 Pays-Bas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Sélectionnez le marché où vous souhaitez faire de la
                        publicité
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Keywords */}
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.keywords")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("form.keywords_placeholder")}
                        className="min-h-[80px]"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.keywords_description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Progress Bar (shown during submission) */}
              {isSubmitting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t("form.submitting")}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("form.submitting")}
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    {t("form.submit")}
                  </>
                )}
              </Button>

              {!canSubmit && (
                <div className="text-center">
                  <p className="text-muted-foreground mb-2 text-sm">
                    Vous avez utilisé toutes vos analyses pour ce mois
                  </p>
                  <Button variant="outline" size="sm">
                    {t("quota.upgrade")}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
