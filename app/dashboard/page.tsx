"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

const stats = [
  {
    title: "Revenus Totaux",
    value: "€45,231.89",
    description: "+20.1% par rapport au mois dernier",
    icon: DollarSign,
    trend: "up",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  {
    title: "Utilisateurs",
    value: "+2,350",
    description: "+180.1% par rapport au mois dernier",
    icon: Users,
    trend: "up",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    title: "Ventes",
    value: "+12,234",
    description: "+19% par rapport au mois dernier",
    icon: ShoppingCart,
    trend: "up",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    title: "Actifs Maintenant",
    value: "573",
    description: "+201 depuis la dernière heure",
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
    action: "a effectué un achat",
    amount: "€299.00",
    time: "Il y a 2 min",
  },
  {
    id: 2,
    user: "Bob Johnson",
    action: "s'est inscrit",
    amount: "Nouveau",
    time: "Il y a 5 min",
  },
  {
    id: 3,
    user: "Claire Dubois",
    action: "a mis à jour son profil",
    amount: "-",
    time: "Il y a 12 min",
  },
  {
    id: 4,
    user: "David Lee",
    action: "a effectué un achat",
    amount: "€89.00",
    time: "Il y a 23 min",
  },
  {
    id: 5,
    user: "Emma Wilson",
    action: "a annulé une commande",
    amount: "-€156.00",
    time: "Il y a 1 heure",
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Bienvenue ! Voici un aperçu de votre activité.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart className="mr-2 h-4 w-4" />
            Télécharger
          </Button>
          <Button className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700">
            <Package className="mr-2 h-4 w-4" />
            Nouveau Produit
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {stat.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stat.description}
              </p>
              <div className="absolute top-0 right-0 p-2">
                {stat.trend === "up" && (
                  <TrendingUp className="h-4 w-4 text-green-500 opacity-20" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Vue d&apos;ensemble</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Évolution de vos revenus sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <BarChart className="h-12 w-12 mx-auto text-violet-600 dark:text-violet-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Graphique des revenus
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Activité Récente</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Les dernières actions sur votre plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                      {activity.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.user}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.action}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.amount}</p>
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
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Performance des Ventes</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">Taux de conversion ce mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Visiteurs</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">12,543</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-violet-600 h-2 rounded-full" style={{ width: "75%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Conversions</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">3,234</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: "58%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Taux de rebond</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">24.3%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-pink-600 h-2 rounded-full" style={{ width: "24%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Top Produits</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">Les plus vendus ce mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Produit Premium", "Produit Standard", "Produit Basic"].map((product, index) => (
                <div key={product} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      index === 0 ? "bg-violet-600" : index === 1 ? "bg-purple-600" : "bg-pink-600"
                    )} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{product}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {index === 0 ? "€12,456" : index === 1 ? "€8,234" : "€5,123"}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">
              Voir tous les produits
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Objectifs du Mois</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">Progression vers vos objectifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Revenus</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">78%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-violet-600 to-purple-600 h-2 rounded-full" style={{ width: "78%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Nouveaux Clients</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">92%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full" style={{ width: "92%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Satisfaction</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">96%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full" style={{ width: "96%" }} />
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