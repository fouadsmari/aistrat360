"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

const adminStats = [
  {
    title: "Utilisateurs Totaux",
    value: "8,742",
    description: "+12% ce mois",
    icon: Users,
    trend: "up",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    title: "Revenus Mensuels",
    value: "€124,589",
    description: "+23.5% vs mois dernier",
    icon: DollarSign,
    trend: "up",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  {
    title: "Abonnements Actifs",
    value: "6,234",
    description: "+8.2% ce mois",
    icon: UserCheck,
    trend: "up",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    title: "Alertes Système",
    value: "3",
    description: "2 critiques, 1 warning",
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
    status: "active",
    joinedAt: "Il y a 2h",
  },
  {
    id: 2,
    name: "Marc Leblanc",
    email: "marc@example.com",
    plan: "Standard",
    status: "active",
    joinedAt: "Il y a 4h",
  },
  {
    id: 3,
    name: "Julie Martin",
    email: "julie@example.com",
    plan: "Basic",
    status: "suspended",
    joinedAt: "Il y a 1j",
  },
  {
    id: 4,
    name: "Pierre Dubois",
    email: "pierre@example.com",
    plan: "Premium",
    status: "active",
    joinedAt: "Il y a 2j",
  },
  {
    id: 5,
    name: "Emma Wilson",
    email: "emma@example.com",
    plan: "Standard",
    status: "inactive",
    joinedAt: "Il y a 3j",
  },
]

const systemAlerts = [
  {
    id: 1,
    type: "critical",
    message: "Pic de charge serveur détecté",
    time: "Il y a 15 min",
  },
  {
    id: 2,
    type: "critical",
    message: "Erreur base de données - Pool de connexions saturé",
    time: "Il y a 32 min",
  },
  {
    id: 3,
    type: "warning",
    message: "Espace disque faible sur serveur-02",
    time: "Il y a 1h",
  },
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Dashboard Administrateur
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Gestion et supervision de l'application SaaS
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Database className="mr-2 h-4 w-4" />
            Sauvegarde
          </Button>
          <Button className="bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700">
            <Settings className="mr-2 h-4 w-4" />
            Configuration
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {adminStats.map((stat) => (
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
                {stat.trend === "warning" && (
                  <AlertTriangle className="h-4 w-4 text-orange-500 opacity-20" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Gestion des Utilisateurs</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Derniers utilisateurs inscrits et leur statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white text-sm font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.plan}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.joinedAt}</p>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      user.status === "active" && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
                      user.status === "inactive" && "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400",
                      user.status === "suspended" && "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                    )}>
                      {user.status === "active" && "Actif"}
                      {user.status === "inactive" && "Inactif"}
                      {user.status === "suspended" && "Suspendu"}
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Mail className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Settings className="h-3 w-3" />
                      </Button>
                      {user.status === "active" ? (
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                          <UserX className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
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
        
        <Card className="col-span-3 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />
              Alertes Système
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Supervision en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className={cn(
                  "p-3 rounded-lg border-l-4",
                  alert.type === "critical" && "bg-red-50 dark:bg-red-950/20 border-red-500",
                  alert.type === "warning" && "bg-orange-50 dark:bg-orange-950/20 border-orange-500"
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={cn(
                        "text-sm font-medium",
                        alert.type === "critical" && "text-red-800 dark:text-red-400",
                        alert.type === "warning" && "text-orange-800 dark:text-orange-400"
                      )}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
            <Button variant="outline" className="w-full mt-4">
              Voir toutes les alertes
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Répartition des Abonnements</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">Distribution par plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Premium</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">2,847 (32%)</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-600 to-violet-600 h-2 rounded-full" style={{ width: "32%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Standard</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">3,895 (45%)</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full" style={{ width: "45%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Basic</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">2,000 (23%)</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full" style={{ width: "23%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Performance Serveurs</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">État des ressources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">CPU</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">68%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: "68%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Mémoire</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">82%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: "82%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Stockage</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">45%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "45%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Actions Rapides</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">Outils d'administration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700">
                <Users className="mr-2 h-4 w-4" />
                Gérer les Utilisateurs
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart className="mr-2 h-4 w-4" />
                Rapports Avancés
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Database className="mr-2 h-4 w-4" />
                Base de Données
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Communication
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                Sécurité
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