"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
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
  User,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Settings,
  Eye,
} from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  phone: string | null
  company: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  created_at: string
  updated_at: string
  last_sign_in_at: string | null
  is_active: boolean
}

interface CreateUserData {
  email: string
  password: string
  first_name: string
  last_name: string
  role: string
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
  const router = useRouter()
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

  // Fetch all users from the database
  const fetchUsers = useCallback(async () => {
    try {
      const supabase = createSupabaseClient()

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching users:", error)
        showToast({
          message: "Error loading users",
          type: "error",
          duration: 4000,
        })
        return
      }

      setUsers(profiles || [])
    } catch (error) {
      console.error("Error:", error)
      showToast({
        message: "Unexpected error loading users",
        type: "error",
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  // Create new user
  const handleCreateUser = async () => {
    if (
      !createFormData.email ||
      !createFormData.password ||
      !createFormData.first_name ||
      !createFormData.last_name
    ) {
      showToast({
        message: "Please fill in all required fields",
        type: "error",
        duration: 4000,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createSupabaseClient()

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: createFormData.email,
        password: createFormData.password,
        options: {
          data: {
            first_name: createFormData.first_name,
            last_name: createFormData.last_name,
          },
        },
      })

      if (authError) {
        showToast({
          message: `Error creating user: ${authError.message}`,
          type: "error",
          duration: 4000,
        })
        setIsSubmitting(false)
        return
      }

      if (authData.user) {
        // Update profile with additional information
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            first_name: createFormData.first_name,
            last_name: createFormData.last_name,
            role: createFormData.role,
            phone: createFormData.phone || null,
            company: createFormData.company || null,
            address: createFormData.address || null,
            city: createFormData.city || null,
            postal_code: createFormData.postal_code || null,
            country: createFormData.country || null,
            is_active: true,
          })
          .eq("id", authData.user.id)

        if (profileError) {
          console.error("Error updating profile:", profileError)
          showToast({
            message: `Database error saving new user: ${profileError.message}`,
            type: "error",
            duration: 4000,
          })
          setIsSubmitting(false)
          return
        }

        showToast({
          message: "User created successfully",
          type: "success",
          duration: 3000,
        })

        setIsCreateDialogOpen(false)
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
        fetchUsers() // Refresh the users list
      }
    } catch (error) {
      console.error("Error creating user:", error)
      showToast({
        message: "Unexpected error creating user",
        type: "error",
        duration: 4000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update user
  const handleEditUser = async () => {
    if (!selectedUser || !editFormData.first_name || !editFormData.last_name) {
      showToast({
        message: "Please fill in all required fields",
        type: "error",
        duration: 4000,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createSupabaseClient()

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: editFormData.first_name,
          last_name: editFormData.last_name,
          role: editFormData.role,
          phone: editFormData.phone || null,
          company: editFormData.company || null,
          address: editFormData.address || null,
          city: editFormData.city || null,
          postal_code: editFormData.postal_code || null,
          country: editFormData.country || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedUser.id)

      if (error) {
        showToast({
          message: `Error updating user: ${error.message}`,
          type: "error",
          duration: 4000,
        })
        setIsSubmitting(false)
        return
      }

      showToast({
        message: "User updated successfully",
        type: "success",
        duration: 3000,
      })

      setIsEditDialogOpen(false)
      setSelectedUser(null)
      setEditFormData({})
      fetchUsers() // Refresh the users list
    } catch (error) {
      console.error("Error updating user:", error)
      showToast({
        message: "Unexpected error updating user",
        type: "error",
        duration: 4000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const supabase = createSupabaseClient()

      // First delete from profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", selectedUser.id)

      if (profileError) {
        showToast({
          message: `Error deleting user profile: ${profileError.message}`,
          type: "error",
          duration: 4000,
        })
        setIsSubmitting(false)
        return
      }

      showToast({
        message: "User deleted successfully",
        type: "success",
        duration: 3000,
      })

      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers() // Refresh the users list
    } catch (error) {
      console.error("Error deleting user:", error)
      showToast({
        message: "Unexpected error deleting user",
        type: "error",
        duration: 4000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle user active status
  const toggleUserStatus = async (user: UserProfile) => {
    try {
      const supabase = createSupabaseClient()

      const { error } = await supabase
        .from("profiles")
        .update({
          is_active: !user.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        showToast({
          message: `Error updating user status: ${error.message}`,
          type: "error",
          duration: 4000,
        })
        return
      }

      showToast({
        message: `User ${!user.is_active ? "activated" : "suspended"} successfully`,
        type: "success",
        duration: 3000,
      })

      fetchUsers() // Refresh the users list
    } catch (error) {
      console.error("Error updating user status:", error)
      showToast({
        message: "Unexpected error updating user status",
        type: "error",
        duration: 4000,
      })
    }
  }

  // Open edit dialog with user data
  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user)
    setEditFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: user.role,
      phone: user.phone || "",
      company: user.company || "",
      address: user.address || "",
      city: user.city || "",
      postal_code: user.postal_code || "",
      country: user.country || "",
    })
    setIsEditDialogOpen(true)
  }

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.first_name &&
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.last_name &&
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.company &&
        user.company.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Get user stats
  const totalUsers = users.length
  const activeUsers = users.filter((user) => user.is_active).length
  const suspendedUsers = users.filter((user) => !user.is_active).length
  const todaysUsers = users.filter((user) => {
    const today = new Date().toDateString()
    return new Date(user.created_at).toDateString() === today
  }).length

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === "fr" ? "fr-FR" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    )
  }

  const formatTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    )

    if (diffInMinutes < 60) {
      return `${diffInMinutes}${locale === "fr" ? " min" : " min"}`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours}${locale === "fr" ? "h" : "h"}`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}${locale === "fr" ? "j" : "d"}`
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">{tCommon("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {t("title")}
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {locale === "fr"
              ? "Gérez vos utilisateurs abonnés"
              : "Manage your subscribed users"}
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700">
              <Plus className="mr-2 h-4 w-4" />
              {t("addUser")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("addUser")}</DialogTitle>
              <DialogDescription>
                {locale === "fr"
                  ? "Créez un nouvel utilisateur abonné"
                  : "Create a new subscribed user"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-first-name">
                  {locale === "fr" ? "Prénom" : "First Name"} *
                </Label>
                <Input
                  id="create-first-name"
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
              <div className="space-y-2">
                <Label htmlFor="create-last-name">
                  {locale === "fr" ? "Nom" : "Last Name"} *
                </Label>
                <Input
                  id="create-last-name"
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
              <div className="col-span-2 space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
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
              <div className="col-span-2 space-y-2">
                <Label htmlFor="create-password">
                  {locale === "fr" ? "Mot de passe" : "Password"} *
                </Label>
                <Input
                  id="create-password"
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
              <div className="space-y-2">
                <Label htmlFor="create-role">
                  {locale === "fr" ? "Rôle" : "Role"}
                </Label>
                <Select
                  value={createFormData.role}
                  onValueChange={(value) =>
                    setCreateFormData({ ...createFormData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscriber">
                      {locale === "fr" ? "Abonné" : "Subscriber"}
                    </SelectItem>
                    <SelectItem value="admin">
                      {locale === "fr" ? "Administrateur" : "Administrator"}
                    </SelectItem>
                    <SelectItem value="super_admin">
                      {locale === "fr" ? "Super Admin" : "Super Admin"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">
                  {locale === "fr" ? "Téléphone" : "Phone"}
                </Label>
                <Input
                  id="create-phone"
                  value={createFormData.phone}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-company">
                  {locale === "fr" ? "Entreprise" : "Company"}
                </Label>
                <Input
                  id="create-company"
                  value={createFormData.company}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      company: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-city">
                  {locale === "fr" ? "Ville" : "City"}
                </Label>
                <Input
                  id="create-city"
                  value={createFormData.city}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      city: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="create-address">
                  {locale === "fr" ? "Adresse" : "Address"}
                </Label>
                <Input
                  id="create-address"
                  value={createFormData.address}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-postal-code">
                  {locale === "fr" ? "Code postal" : "Postal Code"}
                </Label>
                <Input
                  id="create-postal-code"
                  value={createFormData.postal_code}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      postal_code: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-country">
                  {locale === "fr" ? "Pays" : "Country"}
                </Label>
                <Input
                  id="create-country"
                  value={createFormData.country}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      country: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button onClick={handleCreateUser} disabled={isSubmitting}>
                {isSubmitting ? tCommon("loading") : t("addUser")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalUsers")}
            </CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("activeUsers")}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeUsers}
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("suspended")}
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {suspendedUsers}
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("newToday")}
            </CardTitle>
            <Plus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {todaysUsers}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
        <CardHeader>
          <CardTitle>
            {locale === "fr"
              ? "Derniers utilisateurs inscrits et leur statut"
              : "Recent registered users and their status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 pb-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t("searchUsers")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-lg border border-gray-200/30 dark:border-gray-800/20">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {locale === "fr" ? "Utilisateur" : "User"}
                  </TableHead>
                  <TableHead>{locale === "fr" ? "Plan" : "Plan"}</TableHead>
                  <TableHead>
                    {locale === "fr" ? "Dernière activité" : "Last Activity"}
                  </TableHead>
                  <TableHead>{locale === "fr" ? "Statut" : "Status"}</TableHead>
                  <TableHead className="text-right">
                    {locale === "fr" ? "Actions" : "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-orange-600 text-white">
                          {(user.first_name || user.email)
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.email.split("@")[0]}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "admin" || user.role === "super_admin"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {user.role === "subscriber"
                          ? locale === "fr"
                            ? "Standard"
                            : "Standard"
                          : user.role === "admin"
                            ? locale === "fr"
                              ? "Premium"
                              : "Premium"
                            : user.role === "super_admin"
                              ? locale === "fr"
                                ? "Premium"
                                : "Premium"
                              : locale === "fr"
                                ? "Basic"
                                : "Basic"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {locale === "fr" ? "Il y a" : ""}{" "}
                        {formatTime(user.updated_at || user.created_at)}{" "}
                        {locale === "en" ? "ago" : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_active ? "default" : "destructive"}
                      >
                        {user.is_active
                          ? locale === "fr"
                            ? "Active"
                            : "Active"
                          : locale === "fr"
                            ? "Suspendu"
                            : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            {locale === "fr" ? "Actions" : "Actions"}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t("editUser")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleUserStatus(user)}
                          >
                            {user.is_active ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                {t("suspendUser")}
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                {t("activateUser")}
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            {locale === "fr" ? "Envoyer email" : "Send email"}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("viewProfile")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("deleteUser")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center">
                      <div className="text-gray-500">
                        {searchTerm
                          ? locale === "fr"
                            ? "Aucun utilisateur trouvé"
                            : "No users found"
                          : locale === "fr"
                            ? "Aucun utilisateur"
                            : "No users"}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("editUser")}</DialogTitle>
            <DialogDescription>
              {locale === "fr"
                ? "Modifiez les informations de l'utilisateur"
                : "Update user information"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-first-name">
                {locale === "fr" ? "Prénom" : "First Name"} *
              </Label>
              <Input
                id="edit-first-name"
                value={editFormData.first_name || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    first_name: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-last-name">
                {locale === "fr" ? "Nom" : "Last Name"} *
              </Label>
              <Input
                id="edit-last-name"
                value={editFormData.last_name || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    last_name: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">
                {locale === "fr" ? "Rôle" : "Role"}
              </Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscriber">
                    {locale === "fr" ? "Abonné" : "Subscriber"}
                  </SelectItem>
                  <SelectItem value="admin">
                    {locale === "fr" ? "Administrateur" : "Administrator"}
                  </SelectItem>
                  <SelectItem value="super_admin">
                    {locale === "fr" ? "Super Admin" : "Super Admin"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">
                {locale === "fr" ? "Téléphone" : "Phone"}
              </Label>
              <Input
                id="edit-phone"
                value={editFormData.phone || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">
                {locale === "fr" ? "Entreprise" : "Company"}
              </Label>
              <Input
                id="edit-company"
                value={editFormData.company || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, company: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-city">
                {locale === "fr" ? "Ville" : "City"}
              </Label>
              <Input
                id="edit-city"
                value={editFormData.city || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, city: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-address">
                {locale === "fr" ? "Adresse" : "Address"}
              </Label>
              <Input
                id="edit-address"
                value={editFormData.address || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, address: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-postal-code">
                {locale === "fr" ? "Code postal" : "Postal Code"}
              </Label>
              <Input
                id="edit-postal-code"
                value={editFormData.postal_code || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    postal_code: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-country">
                {locale === "fr" ? "Pays" : "Country"}
              </Label>
              <Input
                id="edit-country"
                value={editFormData.country || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, country: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting ? tCommon("loading") : tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteUser")}</DialogTitle>
            <DialogDescription>
              {locale === "fr"
                ? "Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
                : "Are you sure you want to delete this user? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center space-x-3 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-orange-600 text-white">
                  {(selectedUser.first_name || selectedUser.email)
                    ?.charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">
                    {selectedUser.first_name && selectedUser.last_name
                      ? `${selectedUser.first_name} ${selectedUser.last_name}`
                      : selectedUser.email.split("@")[0]}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedUser.email}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? tCommon("loading") : t("deleteUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {ToastComponent}
    </div>
  )
}
