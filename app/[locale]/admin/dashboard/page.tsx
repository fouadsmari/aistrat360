"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  DollarSign,
  Shield,
  TrendingUp,
  Activity,
  AlertTriangle,
  UserCheck,
  UserX,
  Settings,
  Database,
  BarChart,
  Mail,
} from "lucide-react"
import { useTranslations } from "next-intl"


export default function AdminDashboardPage() {
  const t = useTranslations("admin")
  
  const adminStats = [
    {
      title: t("stats.totalUsers"),
      value: "8,742",
      description: `+12% ${t("stats.thisMonth")}`,
      icon: Users,
      trend: "up",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: t("stats.monthlyRevenue"),
      value: "€124,589",
      description: `+23.5% ${t("stats.vsLastMonth")}`,
      icon: DollarSign,
      trend: "up",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: t("stats.activeSubscriptions"),
      value: "6,234",
      description: `+8.2% ${t("stats.thisMonth")}`,
      icon: UserCheck,
      trend: "up",
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      title: t("stats.systemAlerts"),
      value: "3",
      description: `2 ${t("stats.criticalAlerts")}`,
      icon: AlertTriangle,
      trend: "warning",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
  ]

  const recentUsers = [
    {
      id: 1,
      name: "Sophie Durand",
      email: "sophie@example.com",
      plan: "Premium",
      status: "active" as const,
      joinedAt: `${t("time.ago")} 2${t("time.hours")}`,
    },
    {
      id: 2,
      name: "Marc Leblanc", 
      email: "marc@example.com",
      plan: "Standard",
      status: "active" as const,
      joinedAt: `${t("time.ago")} 4${t("time.hours")}`,
    },
    {
      id: 3,
      name: "Julie Martin",
      email: "julie@example.com", 
      plan: "Basic",
      status: "suspended" as const,
      joinedAt: `${t("time.ago")} 1${t("time.days")}`,
    },
    {
      id: 4,
      name: "Pierre Dubois",
      email: "pierre@example.com",
      plan: "Premium", 
      status: "active" as const,
      joinedAt: `${t("time.ago")} 2${t("time.days")}`,
    },
    {
      id: 5,
      name: "Emma Wilson",
      email: "emma@example.com",
      plan: "Standard",
      status: "inactive" as const,
      joinedAt: `${t("time.ago")} 3${t("time.days")}`,
    },
  ]

  const systemAlerts = [
    {
      id: 1,
      type: "critical" as const,
      message: "Pic de charge serveur détecté",
      time: `${t("time.ago")} 15 ${t("time.minutes")}`,
    },
    {
      id: 2,
      type: "critical" as const,
      message: "Erreur base de données - Pool de connexions saturé",
      time: `${t("time.ago")} 32 ${t("time.minutes")}`,
    },
    {
      id: 3,
      type: "warning" as const,
      message: "Espace disque faible sur serveur-02",
      time: `${t("time.ago")} 1${t("time.hours")}`,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {t("dashboard")}
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t("title")} - Gestion et supervision de l&apos;application SaaS
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Database className="mr-2 h-4 w-4" />
            {t("actions.backup")}
          </Button>
          <Button className="bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700">
            <Settings className="mr-2 h-4 w-4" />
            {t("actions.configuration")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {adminStats.map((stat) => (
          <Card
            key={stat.title}
            className="relative overflow-hidden border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {stat.title}
              </CardTitle>
              <div className={cn("rounded-lg p-2", stat.bgColor)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {stat.description}
              </p>
              <div className="absolute right-0 top-0 p-2">
                {stat.trend === "up" && (
                  <TrendingUp className="h-4 w-4 text-green-500 opacity-20" />
                )}
                {stat.trend === "warning" && (
                  <AlertTriangle className="h-4 w-4 text-orange-500 opacity-20" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {t("userManagement.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Derniers utilisateurs inscrits et leur statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-orange-600 text-sm font-medium text-white">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.plan}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.joinedAt}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        user.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : user.status === "inactive"
                            ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                            : user.status === "suspended"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : ""
                      )}
                    >
                      {user.status === "active" && t("status.active")}
                      {user.status === "inactive" && t("status.inactive")}
                      {user.status === "suspended" && t("status.suspended")}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      {user.status === "active" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <UserCheck className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />
              {t("alerts.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Supervision en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "rounded-lg border-l-4 p-3",
                    alert.type === "critical"
                      ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                      : alert.type === "warning"
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                        : ""
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          alert.type === "critical"
                            ? "text-red-800 dark:text-red-400"
                            : alert.type === "warning"
                              ? "text-orange-800 dark:text-orange-400"
                              : ""
                        )}
                      >
                        {alert.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {alert.time}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full">
              {t("actions.viewAllAlerts")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {t("subscriptionDistribution.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {t("subscriptionDistribution.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Premium
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    2,847 (32%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-violet-600"
                    style={{ width: "32%" }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Standard
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    3,895 (45%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600"
                    style={{ width: "45%" }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Basic
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    2,000 (23%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600"
                    style={{ width: "23%" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {t("serverPerformance.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {t("serverPerformance.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t("serverPerformance.cpu")}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    68%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width: "68%" }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t("serverPerformance.memory")}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    82%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{ width: "82%" }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t("serverPerformance.storage")}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    45%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: "45%" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {t("quickActions.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {t("quickActions.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700">
                <Users className="mr-2 h-4 w-4" />
                {t("actions.manageUsers")}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart className="mr-2 h-4 w-4" />
                {t("actions.advancedReports")}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Database className="mr-2 h-4 w-4" />
                {t("actions.database")}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                {t("actions.communication")}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                {t("actions.security")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
