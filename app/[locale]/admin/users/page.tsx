"use client"

import { useState, useEffect, useCallback } from "react"
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
  const fetchUsers = useCallback(async () => {
    console.log("🔄 fetchUsers called")
    setLoading(true)
    try {
      console.log("📡 Calling /api/admin/users")
      const response = await fetch("/api/admin/users")
      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch users`)
      }

      const data = await response.json()
      console.log("📡 Response data:", data)

      if (data.error) {
        throw new Error(data.error)
      }

      console.log("✅ Setting users:", data.users?.length || 0)
      setUsers(data.users || [])
    } catch (error) {
      console.error("❌ Error fetching users:", error)
      showToast({
        message:
          error instanceof Error ? error.message : "Failed to fetch users",
        type: "error",
      })
      setUsers([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
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
      console.error("❌ Error creating user:", error)
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
    try {
      const response = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user")
      }

      await fetchUsers()
      showToast({
        message: "User updated successfully",
        type: "success",
      })
      setIsEditDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("Error updating user:", error)
      showToast({
        message:
          error instanceof Error ? error.message : "Failed to update user",
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
      console.error("Error deleting user:", error)
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

  // User statistics
  const totalUsers = users.length
  const activeUsers = users.filter((user) => user.is_active).length
  const adminUsers = users.filter(
    (user) => user.role === "admin" || user.role === "super_admin"
  ).length
  const subscriberUsers = users.filter((user) => user.role === "subscriber")
    .length

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
          <p className="mt-2 text-gray-500 dark:text-gray-400">{t("description")}</p>
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
            <div className={cn("rounded-lg p-2", "bg-blue-50 dark:bg-blue-950/30")}>
              <Users className={cn("h-4 w-4", "text-blue-600 dark:text-blue-400")} />
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
            <div className={cn("rounded-lg p-2", "bg-green-50 dark:bg-green-950/30")}>
              <UserCheck className={cn("h-4 w-4", "text-green-600 dark:text-green-400")} />
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
            <div className={cn("rounded-lg p-2", "bg-violet-50 dark:bg-violet-950/30")}>
              <Shield className={cn("h-4 w-4", "text-violet-600 dark:text-violet-400")} />
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
            <div className={cn("rounded-lg p-2", "bg-orange-50 dark:bg-orange-950/30")}>
              <User className={cn("h-4 w-4", "text-orange-600 dark:text-orange-400")} />
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
                      <div className="flex items-center">
                        {getRoleIcon(user.role)}
                        <p className="ml-1 text-sm font-medium text-gray-900 dark:text-white">
                          {getRoleLabel(user.role)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
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