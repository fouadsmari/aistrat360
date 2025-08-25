"use client"

import { Bell, Menu, Moon, Search, Sun, User, LogOut } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import { LanguageSwitcher } from "@/components/ui/language-switcher"

interface HeaderProps {
  onMenuClick: () => void
  isMobile?: boolean
}

export function Header({ onMenuClick, isMobile = false }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const t = useTranslations("header")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error("Erreur lors de la déconnexion:", error.message)
      } else {
        // Rediriger vers la page de connexion après déconnexion
        router.push(`/${locale}/login`)
      }
    } catch (error) {
      console.error("Erreur inattendue lors de la déconnexion:", error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex flex-1 items-center space-x-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder={t("search")}
              className="border-gray-200 bg-gray-50 pl-10 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-gray-600 dark:text-gray-400"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-violet-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>{t("notifications")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {locale === "fr"
                      ? "Nouvelle mise à jour disponible"
                      : "New update available"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {locale === "fr" ? "Il y a 2 heures" : "2 hours ago"}
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {locale === "fr"
                      ? "Rapport mensuel généré"
                      : "Monthly report generated"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {locale === "fr" ? "Il y a 5 heures" : "5 hours ago"}
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center">
                <span className="text-sm text-violet-600 dark:text-violet-400">
                  {locale === "fr"
                    ? "Voir toutes les notifications"
                    : "View all notifications"}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white">
                    U
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{t("profile")}</p>
                  <p className="text-xs text-gray-500">user@example.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/${locale}/profile`)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>{t("profile")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>{t("settings")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>{locale === "fr" ? "Support" : "Help"}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 dark:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t("logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
