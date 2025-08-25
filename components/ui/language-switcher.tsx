"use client"

import { useRouter, useParams, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const languages = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
]

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const t = useTranslations("common")

  const currentLocale = params.locale as string
  const currentLang = languages.find((lang) => lang.code === currentLocale)

  const switchLanguage = (newLocale: string) => {
    if (newLocale === currentLocale) return

    // Replace the locale in the pathname
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
    router.push(newPathname)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 px-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t("language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            className={`flex cursor-pointer items-center gap-2 ${
              currentLocale === lang.code
                ? "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
                : ""
            }`}
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.name}</span>
            {currentLocale === lang.code && (
              <span className="ml-auto h-2 w-2 rounded-full bg-violet-600 dark:bg-violet-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
