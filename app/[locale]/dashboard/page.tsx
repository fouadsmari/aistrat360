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
  ArrowUpRight,
  Users,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Activity,
  CreditCard,
  Package,
  BarChart,
} from "lucide-react"
import { useTranslations } from "next-intl"


export default function DashboardPage() {
  const t = useTranslations("dashboard")
  
  const stats = [
    {
      title: t("stats.totalRevenue"),
      value: "€45,231.89",
      description: `+20.1% ${t("stats.vsLastMonth")}`,
      icon: DollarSign,
      trend: "up",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: t("stats.users"),
      value: "+2,350",
      description: `+180.1% ${t("stats.vsLastMonth")}`,
      icon: Users,
      trend: "up",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: t("stats.sales"),
      value: "+12,234",
      description: `+19% ${t("stats.vsLastMonth")}`,
      icon: ShoppingCart,
      trend: "up",
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      title: t("stats.activeNow"),
      value: "573",
      description: `+201 ${t("stats.sinceLastHour")}`,
      icon: Activity,
      trend: "up",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      user: "Alice Martin",
      action: t("recentActivity.madePurchase"),
      amount: "€299.00",
      time: `${t("time.ago")} 2 ${t("time.minutes")}`,
    },
    {
      id: 2,
      user: "Bob Johnson",
      action: t("recentActivity.signedUp"),
      amount: t("recentActivity.new"),
      time: `${t("time.ago")} 5 ${t("time.minutes")}`,
    },
    {
      id: 3,
      user: "Claire Dubois",
      action: t("recentActivity.updatedProfile"),
      amount: "-",
      time: `${t("time.ago")} 12 ${t("time.minutes")}`,
    },
    {
      id: 4,
      user: "David Lee",
      action: t("recentActivity.madePurchase"),
      amount: "€89.00",
      time: `${t("time.ago")} 23 ${t("time.minutes")}`,
    },
    {
      id: 5,
      user: "Emma Wilson",
      action: t("recentActivity.cancelledOrder"),
      amount: "-€156.00",
      time: `${t("time.ago")} 1 ${t("time.hours")}`,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {t("title")}
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t("welcome")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart className="mr-2 h-4 w-4" />
            {t("download")}
          </Button>
          <Button className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700">
            <Package className="mr-2 h-4 w-4" />
            {t("newProduct")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="relative overflow-hidden border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {t("overview.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {t("overview.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-gradient-to-br from-violet-50 to-purple-50 dark:border-gray-600 dark:from-gray-800 dark:to-gray-700">
              <div className="text-center">
                <BarChart className="mx-auto mb-2 h-12 w-12 text-violet-600 dark:text-violet-400" />
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  {t("overview.revenueChart")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {t("recentActivity.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {t("recentActivity.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-xs font-medium text-white">
                      {activity.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.user}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.action}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.amount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {t("salesPerformance.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {t("salesPerformance.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t("salesPerformance.visitors")}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    12,543
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-violet-600"
                    style={{ width: "75%" }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t("salesPerformance.conversions")}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    3,234
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-purple-600"
                    style={{ width: "58%" }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t("salesPerformance.bounceRate")}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    24.3%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-pink-600"
                    style={{ width: "24%" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {t("topProducts.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {t("topProducts.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[t("topProducts.premiumProduct"), t("topProducts.standardProduct"), t("topProducts.basicProduct")].map(
                (product, index) => (
                  <div
                    key={product}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          index === 0
                            ? "bg-violet-600"
                            : index === 1
                              ? "bg-purple-600"
                              : "bg-pink-600"
                        )}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {product}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {index === 0
                        ? "€12,456"
                        : index === 1
                          ? "€8,234"
                          : "€5,123"}
                    </span>
                  </div>
                )
              )}
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full border-gray-200 text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800"
            >
              {t("topProducts.viewAllProducts")}
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {t("monthlyGoals.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {t("monthlyGoals.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t("monthlyGoals.revenue")}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    78%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600"
                    style={{ width: "78%" }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t("monthlyGoals.newCustomers")}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    92%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"
                    style={{ width: "92%" }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t("monthlyGoals.satisfaction")}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    96%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600"
                    style={{ width: "96%" }}
                  />
                </div>
              </div>
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
