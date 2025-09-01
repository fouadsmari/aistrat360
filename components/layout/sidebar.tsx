"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { createSupabaseClient } from "@/lib/supabase"
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Home,
  Layers,
  Settings,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  Calendar,
  HelpCircle,
  Shield,
  CreditCard,
  Target,
  Zap,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobile?: boolean
}

export function Sidebar({
  isCollapsed,
  onToggle,
  isMobile = false,
}: SidebarProps) {
  const pathname = usePathname()
  const params = useParams()
  const t = useTranslations("sidebar")
  const locale = params.locale as string
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isGoogleAdsOpen, setIsGoogleAdsOpen] = useState(false)

  useEffect(() => {
    async function getUserRole() {
      const supabase = createSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        setUserRole(profile?.role || null)
      }
    }

    getUserRole()
  }, [])

  const sidebarItems = [
    {
      title: t("dashboard"),
      icon: Home,
      href: `/${locale}/dashboard`,
    },
    {
      title: t("analytics"),
      icon: BarChart3,
      href: `/${locale}/dashboard/analytics`,
    },
    {
      title: t("users"),
      icon: Users,
      href: `/${locale}/dashboard/users`,
    },
    {
      title: t("products"),
      icon: Package,
      href: `/${locale}/dashboard/products`,
    },
    {
      title: t("orders"),
      icon: ShoppingCart,
      href: `/${locale}/dashboard/orders`,
    },
    {
      title: t("reports"),
      icon: FileText,
      href: `/${locale}/dashboard/reports`,
    },
    {
      title: t("calendar"),
      icon: Calendar,
      href: `/${locale}/dashboard/calendar`,
    },
    {
      title: t("integrations"),
      icon: Layers,
      href: `/${locale}/dashboard/integrations`,
    },
    {
      title: t("pricing"),
      icon: CreditCard,
      href: `/${locale}/pricing`,
    },
  ]

  const bottomItems = [
    // Only show admin panel for admin and super_admin users
    ...(userRole === "admin" || userRole === "super_admin"
      ? [
          {
            title: t("adminPanel"),
            icon: Shield,
            href: `/${locale}/admin/dashboard`,
          },
        ]
      : []),
    {
      title: t("help"),
      icon: HelpCircle,
      href: `/${locale}/dashboard/help`,
    },
    {
      title: t("settings"),
      icon: Settings,
      href: `/${locale}/dashboard/settings`,
    },
  ]

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-lg font-semibold text-transparent">
              SaaS App
            </span>
          </div>
        )}

        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn("h-8 w-8", isCollapsed && "mx-auto")}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          <TooltipProvider delayDuration={0}>
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          isActive &&
                            "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
                          isCollapsed && "justify-center px-2"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5",
                            !isCollapsed && "mr-3",
                            isActive
                              ? "text-violet-600 dark:text-violet-400"
                              : "text-gray-600 dark:text-gray-400"
                          )}
                        />
                        {!isCollapsed && (
                          <span
                            className={cn(
                              "text-sm",
                              isActive ? "font-medium" : ""
                            )}
                          >
                            {item.title}
                          </span>
                        )}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  )}
                </Tooltip>
              )
            })}

            {/* Google Ads Dropdown */}
            <div className="space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={() => setIsGoogleAdsOpen(!isGoogleAdsOpen)}
                    className={cn(
                      "w-full justify-start",
                      pathname.includes("/tools/") &&
                        "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <Target
                      className={cn(
                        "h-5 w-5",
                        !isCollapsed && "mr-3",
                        pathname.includes("/tools/")
                          ? "text-violet-600 dark:text-violet-400"
                          : "text-gray-600 dark:text-gray-400"
                      )}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left text-sm">
                          Google Ads
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isGoogleAdsOpen ? "rotate-180" : ""
                          )}
                        />
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">Google Ads</TooltipContent>
                )}
              </Tooltip>

              {/* Google Ads Submenu */}
              {!isCollapsed && isGoogleAdsOpen && (
                <div className="ml-4 space-y-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/${locale}/tools/keywords`}>
                        <Button
                          variant={
                            pathname === `/${locale}/tools/keywords`
                              ? "secondary"
                              : "ghost"
                          }
                          className={cn(
                            "w-full justify-start",
                            pathname === `/${locale}/tools/keywords` &&
                              "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400"
                          )}
                        >
                          <Search
                            className={cn(
                              "mr-3 h-4 w-4",
                              pathname === `/${locale}/tools/keywords`
                                ? "text-violet-600 dark:text-violet-400"
                                : "text-gray-600 dark:text-gray-400"
                            )}
                          />
                          <span className="text-sm">Mots-clés</span>
                        </Button>
                      </Link>
                    </TooltipTrigger>
                  </Tooltip>
                </div>
              )}
            </div>
          </TooltipProvider>
        </nav>
      </ScrollArea>

      <div className="border-t border-gray-200 p-2 dark:border-gray-800">
        <nav className="space-y-1">
          <TooltipProvider delayDuration={0}>
            {bottomItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          isActive &&
                            "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
                          isCollapsed && "justify-center px-2"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5",
                            !isCollapsed && "mr-3",
                            isActive
                              ? "text-violet-600 dark:text-violet-400"
                              : "text-gray-600 dark:text-gray-400"
                          )}
                        />
                        {!isCollapsed && (
                          <span
                            className={cn(
                              "text-sm",
                              isActive ? "font-medium" : ""
                            )}
                          >
                            {item.title}
                          </span>
                        )}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </TooltipProvider>
        </nav>
      </div>
    </aside>
  )
}
