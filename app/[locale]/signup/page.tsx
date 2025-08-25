"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Loader2, UserPlus, Mail, Lock, User } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"

export default function SignupPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"))
      setIsLoading(false)
      return
    }

    if (!agreeToTerms) {
      setError(t("termsAgreement"))
      setIsLoading(false)
      return
    }

    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Update profile with additional information
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
            email: email,
          })
          .eq("id", data.user.id)

        if (profileError) {
          console.error("Error updating profile:", profileError)
        }

        router.push(`/${locale}/dashboard`)
      }
    } catch (error) {
      setError(t("somethingWentWrong"))
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4 dark:from-gray-900 dark:via-gray-900 dark:to-violet-950">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 via-purple-400/5 to-pink-400/10 dark:from-violet-500/10 dark:via-purple-500/5 dark:to-pink-500/10" />

      <div className="relative w-full max-w-md">
        <div className="animate-blob absolute -left-4 -top-4 h-72 w-72 rounded-full bg-purple-300 opacity-70 mix-blend-multiply blur-xl filter dark:bg-purple-700 dark:opacity-30" />
        <div className="animate-blob animation-delay-2000 absolute -bottom-8 -right-4 h-72 w-72 rounded-full bg-violet-300 opacity-70 mix-blend-multiply blur-xl filter dark:bg-violet-700 dark:opacity-30" />
        <div className="animate-blob animation-delay-4000 absolute -bottom-4 left-20 h-72 w-72 rounded-full bg-pink-300 opacity-70 mix-blend-multiply blur-xl filter dark:bg-pink-700 dark:opacity-30" />

        <Card className="relative border-violet-200/50 bg-white/90 shadow-2xl backdrop-blur-sm dark:border-violet-800/50 dark:bg-gray-900/90">
          <CardHeader className="space-y-1">
            <div className="mb-6 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-center text-2xl font-bold text-transparent">
              {t("signupTitle")}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              {t("signupTitle")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {locale === "fr" ? "Prénom" : "First Name"}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder={locale === "fr" ? "Prénom" : "First Name"}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11 border-gray-300 pl-10 transition-colors focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700 dark:focus:border-violet-400 dark:focus:ring-violet-400"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {locale === "fr" ? "Nom" : "Last Name"}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder={locale === "fr" ? "Nom" : "Last Name"}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11 border-gray-300 pl-10 transition-colors focus:border-violet-500 focus:ring-violet-500 dark:border-gray-700 dark:focus:border-violet-400 dark:focus:ring-violet-400"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

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

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t("password")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                  {t("confirmPassword")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) =>
                    setAgreeToTerms(checked as boolean)
                  }
                  disabled={isLoading}
                />
                <Label
                  htmlFor="terms"
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  {t("termsAgreement")}{" "}
                  <Link
                    href="/terms"
                    className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    {t("termsOfService")}
                  </Link>{" "}
                  {t("and")}{" "}
                  <Link
                    href="/privacy"
                    className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    {t("privacyPolicy")}
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="h-11 w-full transform bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-violet-700 hover:to-purple-700 hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tCommon("loading")}...
                  </>
                ) : (
                  t("signupButton")
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                    {t("orContinueWith")}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-11 border-gray-300 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                  </svg>
                  <span className="ml-2 text-sm">{t("googleLogin")}</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-11 border-gray-300 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  disabled={isLoading}
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-2 text-sm">{t("githubLogin")}</span>
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {t("alreadyHaveAccount")}{" "}
              <Link
                href={`/${locale}/login`}
                className="font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
              >
                {t("loginButton")}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}