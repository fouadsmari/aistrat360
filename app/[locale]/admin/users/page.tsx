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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/toast"
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  UserCheck,
  UserX,
  Shield,
  Crown,
  User,
} from "lucide-react"

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

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "default"
      case "admin":
        return "secondary"
      default:
        return "outline"
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
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-muted-foreground text-xs">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-muted-foreground text-xs">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-muted-foreground text-xs">Admin & Super Admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <User className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriberUsers}</div>
            <p className="text-muted-foreground text-xs">Regular subscribers</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Create User */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("userList")}</CardTitle>
              <CardDescription>
                Manage and monitor all platform users
              </CardDescription>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("createUser")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
                <DialogHeader>
                  <DialogTitle>{t("createNewUser")}</DialogTitle>
                  <DialogDescription>
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
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
              <Input
                placeholder="Search users by email, name, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">
                            {user.full_name ||
                              `${user.first_name || ""} ${user.last_name || ""}`}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getRoleBadgeVariant(user.role)}
                          className="flex w-fit items-center gap-1"
                        >
                          {getRoleIcon(user.role)}
                          {user.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_active ? "default" : "secondary"}
                        >
                          {user.is_active ? (
                            <>
                              <UserCheck className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="mr-1 h-3 w-3" />
                              Suspended
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(user)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
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
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-sm">
              User: <span className="font-semibold">{selectedUser?.email}</span>
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
