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
import { Eye, EyeOff, Loader2, LogIn, Mail, Lock } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(t("invalidCredentials"))
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Get user profile to check role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()

        // Redirect based on role
        if (profile?.role === "admin" || profile?.role === "super_admin") {
          router.push(`/${locale}/admin/dashboard`)
        } else {
          router.push(`/${locale}/dashboard`)
        }
      }
    } catch (error) {
      setError(t("invalidCredentials"))
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
                <LogIn className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-center text-2xl font-bold text-transparent">
              {t("loginTitle")}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              {t("loginTitle")}
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

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    {t("rememberMe")}
                  </Label>
                </div>

                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-sm text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                >
                  {t("forgotPassword")}
                </Link>
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
                  t("loginButton")
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {t("noAccount")}{" "}
              <Link
                href={`/${locale}/signup`}
                className="font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
              >
                {t("signupButton")}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
