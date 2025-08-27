"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Users,
  DollarSign,
  Settings,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import {
  SubscriptionPack,
  SubscriptionPackQuotas,
} from "@/lib/subscription-utils"

const packFormSchema = z.object({
  name: z.enum(["free", "starter", "pro", "advanced"]),
  display_name_en: z.string().min(1, "English name is required"),
  display_name_fr: z.string().min(1, "French name is required"),
  description_en: z.string().optional(),
  description_fr: z.string().optional(),
  price_monthly: z.number().min(0, "Monthly price must be positive"),
  price_yearly: z.number().min(0, "Yearly price must be positive"),
  is_enabled: z.boolean(),
  is_popular: z.boolean(),
  sort_order: z.number().min(0),
  quotas: z.object({
    projects: z.number().int(),
    storage_gb: z.number().int(),
    api_calls_per_month: z.number().int(),
    team_members: z.number().int(),
  }),
})

type PackFormData = z.infer<typeof packFormSchema>

export default function PacksManagementPage() {
  const t = useTranslations("admin.packManagement")
  const tCommon = useTranslations("common")
  const [packs, setPacks] = useState<SubscriptionPack[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPack, setEditingPack] = useState<SubscriptionPack | null>(null)

  const form = useForm<PackFormData>({
    resolver: zodResolver(packFormSchema),
    defaultValues: {
      name: "free",
      display_name_en: "",
      display_name_fr: "",
      description_en: "",
      description_fr: "",
      price_monthly: 0,
      price_yearly: 0,
      is_enabled: true,
      is_popular: false,
      sort_order: 0,
      quotas: {
        projects: 1,
        storage_gb: 1,
        api_calls_per_month: 1000,
        team_members: 1,
      },
    },
  })

  const fetchPacks = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/packs")
      const result = await response.json()

      if (response.ok) {
        setPacks(result.data || [])
      } else {
        throw new Error(result.error || "Failed to fetch packs")
      }
    } catch (error) {
      console.error("Error fetching packs:", error)
      toast.error(t("messages.loadError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPacks()
  }, [])

  const onSubmit = async (data: PackFormData) => {
    try {
      const url = editingPack
        ? `/api/admin/packs/${editingPack.id}`
        : "/api/admin/packs"
      const method = editingPack ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(
          editingPack
            ? t("messages.updateSuccess")
            : t("messages.createSuccess")
        )
        setIsDialogOpen(false)
        setEditingPack(null)
        form.reset()
        fetchPacks()
      } else {
        throw new Error(result.error || "Operation failed")
      }
    } catch (error) {
      console.error("Error saving pack:", error)
      toast.error(
        editingPack ? t("messages.updateError") : t("messages.createError")
      )
    }
  }

  const handleEdit = (pack: SubscriptionPack) => {
    setEditingPack(pack)
    form.reset({
      name: pack.name,
      display_name_en: pack.display_name_en,
      display_name_fr: pack.display_name_fr,
      description_en: pack.description_en,
      description_fr: pack.description_fr,
      price_monthly: pack.price_monthly,
      price_yearly: pack.price_yearly,
      is_enabled: pack.is_enabled,
      is_popular: pack.is_popular,
      sort_order: pack.sort_order,
      quotas: pack.quotas,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (pack: SubscriptionPack) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer le pack ${pack.display_name_en} ?`
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/admin/packs/${pack.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(t("messages.deleteSuccess"))
        fetchPacks()
      } else {
        throw new Error(result.error || "Failed to delete pack")
      }
    } catch (error) {
      console.error("Error deleting pack:", error)
      toast.error(t("messages.deleteError"))
    }
  }

  const formatQuotaValue = (value: number, unit?: string) => {
    if (value === -1) return t("unlimited")
    return `${value}${unit ? ` ${unit}` : ""}`
  }

  const formatPrice = (price: number) => {
    return price === 0 ? t("free") : `€${price.toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {t("title")}
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t("subtitle")} - Configuration des tarifs et quotas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <Settings className="mr-2 h-4 w-4" />
            {t("synchronize")}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingPack(null)
                  form.reset()
                }}
                className="bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("createPack")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-gray-200/30 bg-white/95 dark:border-gray-800/20 dark:bg-gray-900/95">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">
                  {editingPack ? t("editPack") : t("createPack")}
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-300">
                  {t("subtitle")}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
                      <TabsTrigger
                        value="basic"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
                      >
                        {t("basicInfo")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="pricing"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
                      >
                        {t("pricing")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="quotas"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
                      >
                        {t("quotas")}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("packName")}
                              </FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                >
                                  <option value="free">Free</option>
                                  <option value="starter">Starter</option>
                                  <option value="pro">Pro</option>
                                  <option value="advanced">Advanced</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="sort_order"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("sortOrder")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="display_name_en"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("displayNameEn")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="display_name_fr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("displayNameFr")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="description_en"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("descriptionEn")}
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description_fr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("descriptionFr")}
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex gap-4">
                        <FormField
                          control={form.control}
                          name="is_enabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("enabled")}
                              </FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="is_popular"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("popular")}
                              </FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price_monthly"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("monthlyPrice")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="price_yearly"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("yearlyPrice")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="quotas" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="quotas.projects"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("maxProjects")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="quotas.storage_gb"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("storageGb")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="quotas.api_calls_per_month"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("apiCalls")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="quotas.team_members"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-300">
                                {t("teamMembers")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false)
                        setEditingPack(null)
                        form.reset()
                      }}
                      className="border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      {t("actions.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700"
                    >
                      {editingPack ? t("actions.update") : t("actions.create")}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-gray-200/30 bg-white/50 dark:border-gray-800/20 dark:bg-gray-900/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Package className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            {t("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-700 dark:text-gray-300">
                    Pack
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">
                    Tarification
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">
                    Quotas
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">
                    Statut
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packs.map((pack) => (
                  <TableRow key={pack.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                            {pack.display_name_en}
                            {pack.is_popular && (
                              <Badge className="bg-gradient-to-r from-purple-600 to-violet-600 text-white">
                                Populaire
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {pack.description_en}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-gray-900 dark:text-white">
                          {formatPrice(pack.price_monthly)}/mois
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatPrice(pack.price_yearly)}/an
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="text-gray-700 dark:text-gray-300">
                          Projets:{" "}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatQuotaValue(pack.quotas.projects)}
                          </span>
                        </div>
                        <div className="text-gray-700 dark:text-gray-300">
                          Stockage:{" "}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatQuotaValue(pack.quotas.storage_gb, "GB")}
                          </span>
                        </div>
                        <div className="text-gray-700 dark:text-gray-300">
                          API:{" "}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatQuotaValue(
                              pack.quotas.api_calls_per_month,
                              "calls/mo"
                            )}
                          </span>
                        </div>
                        <div className="text-gray-700 dark:text-gray-300">
                          Équipe:{" "}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatQuotaValue(
                              pack.quotas.team_members,
                              "membres"
                            )}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          pack.is_enabled
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                        }
                      >
                        {pack.is_enabled
                          ? t("status.enabled")
                          : t("status.disabled")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(pack)}
                          className="border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(pack)}
                          className="border-gray-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-gray-700 dark:text-red-400 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
