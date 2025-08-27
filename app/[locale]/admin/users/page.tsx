"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import {
  Users,
  Plus,
  Search,
  Mail,
  Settings,
  UserCheck,
  UserX,
  Shield,
  Crown,
  User,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type UserRole = "subscriber" | "admin" | "super_admin"

interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  role: UserRole
  is_active: boolean
  phone?: string
  company?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  created_at: string
  updated_at?: string
  password?: string // For editing only, not stored in profile
  subscription_plan?: "free" | "starter" | "pro" | "advanced"
  subscription_status?: string
  subscription_details?: any
}

interface CreateUserData {
  email: string
  password: string
  first_name: string
  last_name: string
  role: UserRole
  phone?: string
  company?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
}

export default function AdminUsersPage() {
  const t = useTranslations("admin.userManagement")
  const tCommon = useTranslations("common")
  const params = useParams()
  const locale = params.locale as string
  const { showToast, ToastComponent } = useToast()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [createFormData, setCreateFormData] = useState<CreateUserData>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "subscriber",
    phone: "",
    company: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
  })

  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({})

  // Fetch all users via API (uses service role)
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/users")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch users`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setUsers(data.users || [])
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "Failed to fetch users",
        type: "error",
      })
      setUsers([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Create new user via API
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createFormData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user")
      }

      await fetchUsers()

      showToast({
        message: `User ${createFormData.first_name} ${createFormData.last_name} created successfully`,
        type: "success",
      })

      // Reset form
      setCreateFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "subscriber",
        phone: "",
        company: "",
        address: "",
        city: "",
        postal_code: "",
        country: "",
      })
      setIsCreateDialogOpen(false)
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "Failed to create user",
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update user via API
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setIsSubmitting(true)

    // LOG DÉTAILLÉ - DÉBUT MODIFICATION
    console.log("🔥 === DÉBUT MODIFICATION UTILISATEUR ===")
    console.log("👤 User sélectionné:", {
      id: selectedUser.id,
      email: selectedUser.email,
      currentPlan: selectedUser.subscription_plan,
    })
    console.log("📋 Données du formulaire editFormData:", editFormData)
    console.log("🎯 Plan à modifier:", {
      ancien: selectedUser.subscription_plan,
      nouveau: editFormData.subscription_plan,
      type: typeof editFormData.subscription_plan,
    })

    try {
      const requestPayload = JSON.stringify(editFormData)
      console.log("📤 Payload envoyé à l'API:", requestPayload)

      const response = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestPayload,
      })

      console.log("📥 Status de réponse:", response.status)
      console.log(
        "📥 Headers de réponse:",
        Object.fromEntries(response.headers.entries())
      )

      const data = await response.json()
      console.log("📥 Réponse complète de l'API:", data)

      if (!response.ok) {
        console.error("❌ ERREUR API:", data.error)
        throw new Error(data.error || "Failed to update user")
      }

      console.log("✅ Réponse API réussie, rechargement des utilisateurs...")
      await fetchUsers()

      showToast({
        message: "User updated successfully",
        type: "success",
      })
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      console.log("🎉 === FIN MODIFICATION UTILISATEUR (SUCCÈS) ===")
    } catch (error) {
      console.error("💥 === ERREUR CRITIQUE ===", error)
      console.error("💥 Type d'erreur:", typeof error)
      console.error(
        "💥 Message d'erreur:",
        error instanceof Error ? error.message : String(error)
      )
      showToast({
        message:
          error instanceof Error ? error.message : "Failed to update user",
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle user status (activate/deactivate)
  const handleToggleUserStatus = async (user: UserProfile) => {
    setIsSubmitting(true)
    try {
      const newStatus = !user.is_active
      const response = await fetch(`/api/admin/users?id=${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...user,
          is_active: newStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user status")
      }

      await fetchUsers()
      showToast({
        message: `User ${newStatus ? "activated" : "suspended"} successfully`,
        type: "success",
      })
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to update user status",
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete user via API
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user")
      }

      await fetchUsers()
      showToast({
        message: "User deleted successfully",
        type: "success",
      })
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "Failed to delete user",
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user)
    setEditFormData({
      email: user.email,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: user.role,
      is_active: user.is_active,
      phone: user.phone || "",
      company: user.company || "",
      address: user.address || "",
      city: user.city || "",
      postal_code: user.postal_code || "",
      country: user.country || "",
      subscription_plan: user.subscription_plan || "free",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (user: UserProfile) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.first_name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (user.last_name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "Super Admin"
      case "admin":
        return "Admin"
      default:
        return "Subscriber"
    }
  }

  const getPackBadge = (plan: string = "free") => {
    const packColors = {
      free: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      starter:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      pro: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      advanced:
        "bg-gold-100 text-gold-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    }

    const packLabels = {
      free: "Gratuit",
      starter: "Starter",
      pro: "Pro",
      advanced: "Avancé",
    }

    return {
      color: packColors[plan as keyof typeof packColors] || packColors.free,
      label: packLabels[plan as keyof typeof packLabels] || packLabels.free,
    }
  }

  // User statistics
  const totalUsers = users.length
  const activeUsers = users.filter((user) => user.is_active).length
  const adminUsers = users.filter(
    (user) => user.role === "admin" || user.role === "super_admin"
  ).length
  const subscriberUsers = users.filter(
    (user) => user.role === "subscriber"
  ).length

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {t("title")}
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t("description")}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700">
              <Plus className="mr-2 h-4 w-4" />
              {t("createUser")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                {t("createNewUser")}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Create a new user account with specified role and details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createFormData.email}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createFormData.password}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={createFormData.first_name}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        first_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={createFormData.last_name}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        last_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={createFormData.role}
                  onValueChange={(value: UserRole) =>
                    setCreateFormData({ ...createFormData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscriber">Subscriber</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Users
            </CardTitle>
            <div
              className={cn("rounded-lg p-2", "bg-blue-50 dark:bg-blue-950/30")}
            >
              <Users
                className={cn("h-4 w-4", "text-blue-600 dark:text-blue-400")}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalUsers}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              All registered users
            </p>
            <div className="absolute right-0 top-0 p-2">
              <Users className="h-4 w-4 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Active Users
            </CardTitle>
            <div
              className={cn(
                "rounded-lg p-2",
                "bg-green-50 dark:bg-green-950/30"
              )}
            >
              <UserCheck
                className={cn("h-4 w-4", "text-green-600 dark:text-green-400")}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeUsers}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Currently active
            </p>
            <div className="absolute right-0 top-0 p-2">
              <UserCheck className="h-4 w-4 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Admins
            </CardTitle>
            <div
              className={cn(
                "rounded-lg p-2",
                "bg-violet-50 dark:bg-violet-950/30"
              )}
            >
              <Shield
                className={cn(
                  "h-4 w-4",
                  "text-violet-600 dark:text-violet-400"
                )}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {adminUsers}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Admin & Super Admin
            </p>
            <div className="absolute right-0 top-0 p-2">
              <Shield className="h-4 w-4 text-violet-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Subscribers
            </CardTitle>
            <div
              className={cn(
                "rounded-lg p-2",
                "bg-orange-50 dark:bg-orange-950/30"
              )}
            >
              <User
                className={cn(
                  "h-4 w-4",
                  "text-orange-600 dark:text-orange-400"
                )}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {subscriberUsers}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Regular subscribers
            </p>
            <div className="absolute right-0 top-0 p-2">
              <User className="h-4 w-4 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            {t("userList")}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by email, name, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No users found.
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-orange-600 text-sm font-medium text-white">
                      {(user.first_name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.full_name ||
                          `${user.first_name || ""} ${user.last_name || ""}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {getRoleLabel(user.role)}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center space-x-2">
                        <div
                          className={cn(
                            "rounded-full px-2 py-1 text-xs font-medium",
                            getPackBadge(user.subscription_plan).color
                          )}
                        >
                          {getPackBadge(user.subscription_plan).label}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        user.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      )}
                    >
                      {user.is_active ? "Active" : "Suspended"}
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
                        onClick={() => openEditDialog(user)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      {user.is_active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleToggleUserStatus(user)}
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          onClick={() => handleToggleUserStatus(user)}
                        >
                          <UserCheck className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => openDeleteDialog(user)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Edit User
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editFormData.email || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      email: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_password">New Password (optional)</Label>
                <Input
                  id="edit_password"
                  type="password"
                  placeholder="Leave empty to keep current password"
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      password: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit_first_name">First Name</Label>
                <Input
                  id="edit_first_name"
                  value={editFormData.first_name || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      first_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_last_name">Last Name</Label>
                <Input
                  id="edit_last_name"
                  value={editFormData.last_name || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      last_name: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={editFormData.phone || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_company">Company</Label>
                <Input
                  id="edit_company"
                  value={editFormData.company || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      company: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_address">Address</Label>
              <Input
                id="edit_address"
                value={editFormData.address || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    address: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="edit_city">City</Label>
                <Input
                  id="edit_city"
                  value={editFormData.city || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      city: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_postal_code">Postal Code</Label>
                <Input
                  id="edit_postal_code"
                  value={editFormData.postal_code || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      postal_code: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_country">Country</Label>
                <Input
                  id="edit_country"
                  value={editFormData.country || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      country: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="edit_role">Role</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value: UserRole) =>
                    setEditFormData({ ...editFormData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscriber">Subscriber</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_is_active">Status</Label>
                <Select
                  value={editFormData.is_active ? "active" : "suspended"}
                  onValueChange={(value) =>
                    setEditFormData({
                      ...editFormData,
                      is_active: value === "active",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_subscription_plan">
                  Plan d&apos;Abonnement
                </Label>
                <Select
                  value={editFormData.subscription_plan || "free"}
                  onValueChange={(
                    value: "free" | "starter" | "pro" | "advanced"
                  ) =>
                    setEditFormData({
                      ...editFormData,
                      subscription_plan: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Gratuit</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="advanced">Avancé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Delete User
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              User:{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedUser?.email}
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {ToastComponent}
    </div>
  )
}
