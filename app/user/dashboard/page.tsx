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
  Target,
  Calendar,
  FileText,
} from "lucide-react"

const userStats = [
  {
    title: "Mon Chiffre d'Affaires",
    value: "€3,247.89",
    description: "+15.2% ce mois",
    icon: DollarSign,
    trend: "up",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  {
    title: "Mes Clients",
    value: "127",
    description: "+8 nouveaux ce mois",
    icon: Users,
    trend: "up",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    title: "Commandes",
    value: "89",
    description: "+12% vs mois dernier",
    icon: ShoppingCart,
    trend: "up",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    title: "Objectif Mensuel",
    value: "78%",
    description: "€2,752 restants",
    icon: Target,
    trend: "up",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
]

const recentActivity = [
  {
    id: 1,
    client: "Marie Leblanc",
    action: "Nouvelle commande",
    amount: "€149.00",
    time: "Il y a 5 min",
  },
  {
    id: 2,
    client: "Paul Martin",
    action: "Paiement reçu",
    amount: "€89.50",
    time: "Il y a 12 min",
  },
  {
    id: 3,
    client: "Sophie Durand",
    action: "Facture créée",
    amount: "€299.00",
    time: "Il y a 1h",
  },
  {
    id: 4,
    client: "Lucas Bernard",
    action: "Commande livrée",
    amount: "€67.00",
    time: "Il y a 2h",
  },
  {
    id: 5,
    client: "Emma Wilson",
    action: "Devis accepté",
    amount: "€450.00",
    time: "Il y a 3h",
  },
]

const upcomingTasks = [
  {
    id: 1,
    task: "Relancer Marie Leblanc - Facture #1234",
    priority: "high",
    dueDate: "Aujourd'hui",
  },
  {
    id: 2,
    task: "Livraison prévue - Commande #5678",
    priority: "medium",
    dueDate: "Demain",
  },
  {
    id: 3,
    task: "Appel commercial - Prospect Premium",
    priority: "high",
    dueDate: "Vendredi",
  },
  {
    id: 4,
    task: "Renouvellement contrat - Sophie D.",
    priority: "low",
    dueDate: "Lundi",
  },
]

export default function UserDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Mon Tableau de Bord
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Bienvenue ! Gérez votre activité en un clin d&apos;œil.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700">
            <Package className="mr-2 h-4 w-4" />
            Nouvelle Vente
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {userStats.map((stat) => (
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
              Performance des Ventes
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Évolution de votre chiffre d&apos;affaires mensuel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-gradient-to-br from-violet-50 to-purple-50 dark:border-gray-600 dark:from-gray-800 dark:to-gray-700">
              <div className="text-center">
                <BarChart className="mx-auto mb-2 h-12 w-12 text-violet-600 dark:text-violet-400" />
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Graphique des performances
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Activité Récente
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Vos dernières transactions et interactions
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
                      {activity.client.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.client}
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
              Tâches à Venir
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Actions prioritaires cette semaine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={cn(
                        "mt-2 h-2 w-2 rounded-full",
                        task.priority === "high"
                          ? "bg-red-500"
                          : task.priority === "medium"
                            ? "bg-yellow-500"
                            : task.priority === "low"
                              ? "bg-green-500"
                              : ""
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.task}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {task.dueDate}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Mes Top Clients
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Plus gros générateurs de CA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Marie Leblanc", "Paul Martin", "Sophie Durand"].map(
                (client, index) => (
                  <div
                    key={client}
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
                        {client}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {index === 0
                        ? "€2,456"
                        : index === 1
                          ? "€1,834"
                          : "€1,123"}
                    </span>
                  </div>
                )
              )}
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full border-gray-200 text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800"
            >
              Voir tous les clients
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Objectifs du Mois
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Votre progression
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Chiffre d&apos;Affaires
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
                    Nouveaux Clients
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    85%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600"
                    style={{ width: "85%" }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Commandes
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    92%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600"
                    style={{ width: "92%" }}
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
