"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
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
import { ArrowLeft, Mail, Send, CheckCircle } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createSupabaseClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/reset-password`,
      })

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setError(
            locale === "fr"
              ? "L'email n'est pas confirmé. Veuillez vérifier votre boîte email."
              : "Email not confirmed. Please check your email inbox."
          )
        } else {
          setError(error.message)
        }
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
    } catch (error) {
      setError(
        locale === "fr"
          ? "Une erreur est survenue. Veuillez réessayer."
          : "An error occurred. Please try again."
      )
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4 dark:from-gray-900 dark:via-gray-900 dark:to-violet-950">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 via-purple-400/5 to-pink-400/10 dark:from-violet-500/10 dark:via-purple-500/5 dark:to-pink-500/10" />

        <div className="relative w-full max-w-md">
          <Card className="relative border-violet-200/50 bg-white/90 shadow-2xl backdrop-blur-sm dark:border-violet-800/50 dark:bg-gray-900/90">
            <CardHeader className="space-y-1 text-center">
              <div className="mb-6 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
                {locale === "fr" ? "Email envoyé !" : "Email Sent!"}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {locale === "fr"
                  ? "Vérifiez votre boîte email pour réinitialiser votre mot de passe"
                  : "Check your email inbox to reset your password"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                <Mail className="mx-auto mb-2 h-8 w-8 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  {locale === "fr"
                    ? `Un lien de réinitialisation a été envoyé à ${email}`
                    : `A reset link has been sent to ${email}`}
                </p>
              </div>

              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                {locale === "fr"
                  ? "Si vous ne voyez pas l'email, vérifiez votre dossier de courrier indésirable."
                  : "If you don't see the email, check your spam folder."}
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setIsSuccess(false)
                    setEmail("")
                  }}
                  variant="outline"
                  className="w-full"
                >
                  {locale === "fr" ? "Renvoyer l'email" : "Resend Email"}
                </Button>

                <Link href={`/${locale}/login`}>
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {locale === "fr"
                      ? "Retour à la connexion"
                      : "Back to Login"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4 dark:from-gray-900 dark:via-gray-900 dark:to-violet-950">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 via-purple-400/5 to-pink-400/10 dark:from-violet-500/10 dark:via-purple-500/5 dark:to-pink-500/10" />

      <div className="relative w-full max-w-md">
        <div className="animate-blob absolute -left-4 -top-4 h-72 w-72 rounded-full bg-purple-300 opacity-70 mix-blend-multiply blur-xl filter dark:bg-purple-700 dark:opacity-30" />
        <div className="animate-blob animation-delay-2000 absolute -bottom-8 -right-4 h-72 w-72 rounded-full bg-violet-300 opacity-70 mix-blend-multiply blur-xl filter dark:bg-violet-700 dark:opacity-30" />

        <Card className="relative border-violet-200/50 bg-white/90 shadow-2xl backdrop-blur-sm dark:border-violet-800/50 dark:bg-gray-900/90">
          <CardHeader className="space-y-1">
            <div className="mb-6 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg">
                <Mail className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-center text-2xl font-bold text-transparent">
              {locale === "fr" ? "Mot de passe oublié" : "Forgot Password"}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              {locale === "fr"
                ? "Entrez votre email pour recevoir un lien de réinitialisation"
                : "Enter your email to receive a reset link"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t("email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-gray-300 pl-10 transition-colors focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700 dark:focus:border-violet-400 dark:focus:ring-violet-400"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full transform bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-violet-700 hover:to-purple-700 hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {locale === "fr" ? "Envoi..." : "Sending..."}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {locale === "fr" ? "Envoyer le lien" : "Send Reset Link"}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <Link
                href={`/${locale}/login`}
                className="flex w-full items-center justify-center text-sm text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {locale === "fr" ? "Retour à la connexion" : "Back to Login"}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
