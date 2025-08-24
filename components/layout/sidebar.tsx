"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const sidebarItems = [
  {
    title: "Tableau de bord",
    icon: Home,
    href: "/dashboard",
  },
  {
    title: "Analytiques",
    icon: BarChart3,
    href: "/dashboard/analytics",
  },
  {
    title: "Utilisateurs",
    icon: Users,
    href: "/dashboard/users",
  },
  {
    title: "Produits",
    icon: Package,
    href: "/dashboard/products",
  },
  {
    title: "Commandes",
    icon: ShoppingCart,
    href: "/dashboard/orders",
  },
  {
    title: "Rapports",
    icon: FileText,
    href: "/dashboard/reports",
  },
  {
    title: "Calendrier",
    icon: Calendar,
    href: "/dashboard/calendar",
  },
  {
    title: "Intégrations",
    icon: Layers,
    href: "/dashboard/integrations",
  },
]

const bottomItems = [
  {
    title: "Panel Admin",
    icon: Shield,
    href: "/admin/dashboard",
  },
  {
    title: "Aide",
    icon: HelpCircle,
    href: "/dashboard/help",
  },
  {
    title: "Paramètres",
    icon: Settings,
    href: "/dashboard/settings",
  },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobile?: boolean
}

export function Sidebar({ isCollapsed, onToggle, isMobile = false }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              SaaS App
            </span>
          </div>
        )}
        
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "h-8 w-8",
              isCollapsed && "mx-auto"
            )}
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
                          isActive && "bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400",
                          isCollapsed && "justify-center px-2"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5",
                          !isCollapsed && "mr-3",
                          isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-600 dark:text-gray-400"
                        )} />
                        {!isCollapsed && (
                          <span className={cn(
                            "text-sm",
                            isActive ? "font-medium" : ""
                          )}>
                            {item.title}
                          </span>
                        )}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </TooltipProvider>
        </nav>
      </ScrollArea>
      
      <div className="border-t border-gray-200 dark:border-gray-800 p-2">
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
                          isActive && "bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400",
                          isCollapsed && "justify-center px-2"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5",
                          !isCollapsed && "mr-3",
                          isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-600 dark:text-gray-400"
                        )} />
                        {!isCollapsed && (
                          <span className={cn(
                            "text-sm",
                            isActive ? "font-medium" : ""
                          )}>
                            {item.title}
                          </span>
                        )}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      {item.title}
                    </TooltipContent>
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