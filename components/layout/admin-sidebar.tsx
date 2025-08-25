"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Users,
  Shield,
  Settings,
  Database,
  Mail,
  AlertTriangle,
  Activity,
  DollarSign,
  FileText,
  HelpCircle,
  UserCheck,
  Globe,
  Lock,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


interface AdminSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobile?: boolean
}

export function AdminSidebar({
  isCollapsed,
  onToggle,
  isMobile = false,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations("admin.sidebar")

  const adminSidebarItems = [
    {
      title: t("adminDashboard"),
      icon: BarChart3,
      href: "/admin/dashboard",
    },
    {
      title: t("userManagement"),
      icon: Users,
      href: "/admin/users",
    },
    {
      title: t("subscriptions"),
      icon: UserCheck,
      href: "/admin/subscriptions",
    },
    {
      title: t("revenueAnalytics"),
      icon: DollarSign,
      href: "/admin/revenue",
    },
    {
      title: t("systemMonitoring"),
      icon: Activity,
      href: "/admin/monitoring",
    },
    {
      title: t("alertsLogs"),
      icon: AlertTriangle,
      href: "/admin/alerts",
    },
    {
      title: t("database"),
      icon: Database,
      href: "/admin/database",
    },
    {
      title: t("communication"),
      icon: Mail,
      href: "/admin/communication",
    },
    {
      title: t("security"),
      icon: Shield,
      href: "/admin/security",
    },
  ]

  const bottomItems = [
    {
      title: t("userDashboard"),
      icon: Globe,
      href: "/dashboard",
    },
    {
      title: t("support"),
      icon: HelpCircle,
      href: "/admin/support",
    },
    {
      title: t("settings"),
      icon: Settings,
      href: "/admin/settings",
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-orange-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-lg font-semibold text-transparent">
              {t("adminPanel")}
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
            {adminSidebarItems.map((item) => {
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
                            "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
                          isCollapsed && "justify-center px-2"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5",
                            !isCollapsed && "mr-3",
                            isActive
                              ? "text-red-600 dark:text-red-400"
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
                            "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
                          isCollapsed && "justify-center px-2"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5",
                            !isCollapsed && "mr-3",
                            isActive
                              ? "text-red-600 dark:text-red-400"
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
