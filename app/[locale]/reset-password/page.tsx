"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
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
import { Key, Eye, EyeOff, CheckCircle } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"

function ResetPasswordContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState(false)

  useEffect(() => {
    // Check if we have the required parameters from the email link
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")

    if (!accessToken || !refreshToken) {
      setError(
        locale === "fr"
          ? "Lien de réinitialisation invalide ou expiré"
          : "Invalid or expired reset link"
      )
      return
    }

    // Set the session with the tokens from the URL
    const setSession = async () => {
      try {
        const supabase = createSupabaseClient()
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          setError(
            locale === "fr"
              ? "Session invalide ou expirée"
              : "Invalid or expired session"
          )
        } else {
          setIsValidSession(true)
        }
      } catch (error) {
        setError(
          locale === "fr"
            ? "Erreur lors de la validation du lien"
            : "Error validating reset link"
        )
      }
    }

    setSession()
  }, [searchParams, locale])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validation
    if (!password || !confirmPassword) {
      setError(
        locale === "fr"
          ? "Veuillez remplir tous les champs"
          : "Please fill in all fields"
      )
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(
        locale === "fr"
          ? "Les mots de passe ne correspondent pas"
          : "Passwords do not match"
      )
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError(
        locale === "fr"
          ? "Le mot de passe doit contenir au moins 6 caractères"
          : "Password must be at least 6 characters long"
      )
      setIsLoading(false)
      return
    }

    try {
      const supabase = createSupabaseClient()

      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
    } catch (error) {
      setError(
        locale === "fr"
          ? "Une erreur est survenue lors de la mise à jour du mot de passe"
          : "An error occurred while updating the password"
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
                {locale === "fr"
                  ? "Mot de passe mis à jour !"
                  : "Password Updated!"}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {locale === "fr"
                  ? "Votre mot de passe a été modifié avec succès"
                  : "Your password has been successfully updated"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                <p className="text-sm text-green-700 dark:text-green-300">
                  {locale === "fr"
                    ? "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe"
                    : "You can now login with your new password"}
                </p>
              </div>

              <Button
                onClick={() => router.push(`/${locale}/login`)}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700"
              >
                {locale === "fr" ? "Se connecter" : "Go to Login"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isValidSession && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4 dark:from-gray-900 dark:via-gray-900 dark:to-violet-950">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 via-purple-400/5 to-pink-400/10 dark:from-violet-500/10 dark:via-purple-500/5 dark:to-pink-500/10" />

        <div className="relative w-full max-w-md">
          <Card className="relative border-red-200/50 bg-white/90 shadow-2xl backdrop-blur-sm dark:border-red-800/50 dark:bg-gray-900/90">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-red-600 dark:text-red-400">
                {locale === "fr" ? "Lien invalide" : "Invalid Link"}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {error}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <Link href={`/${locale}/forgot-password`}>
                  <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700">
                    {locale === "fr"
                      ? "Demander un nouveau lien"
                      : "Request New Link"}
                  </Button>
                </Link>

                <Link href={`/${locale}/login`}>
                  <Button variant="ghost" className="w-full">
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

  if (!isValidSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4 dark:from-gray-900 dark:via-gray-900 dark:to-violet-950">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
            <p className="mt-2 text-sm text-gray-500">{tCommon("loading")}</p>
          </div>
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
                <Key className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-center text-2xl font-bold text-transparent">
              {locale === "fr" ? "Nouveau mot de passe" : "New Password"}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              {locale === "fr"
                ? "Créez un nouveau mot de passe sécurisé"
                : "Create a new secure password"}
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
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {locale === "fr" ? "Nouveau mot de passe" : "New Password"}
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 border-gray-300 pl-10 pr-10 transition-colors focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700 dark:focus:border-violet-400 dark:focus:ring-violet-400"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {locale === "fr"
                    ? "Confirmer le mot de passe"
                    : "Confirm Password"}
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 border-gray-300 pl-10 pr-10 transition-colors focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700 dark:focus:border-violet-400 dark:focus:ring-violet-400"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {locale === "fr"
                  ? "Le mot de passe doit contenir au moins 6 caractères"
                  : "Password must be at least 6 characters long"}
              </p>

              <Button
                type="submit"
                className="h-11 w-full transform bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-violet-700 hover:to-purple-700 hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {locale === "fr" ? "Mise à jour..." : "Updating..."}
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    {locale === "fr"
                      ? "Mettre à jour le mot de passe"
                      : "Update Password"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4 dark:from-gray-900 dark:via-gray-900 dark:to-violet-950">
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
