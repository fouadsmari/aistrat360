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
  const t = useTranslations("admin")
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
      toast.error("Failed to load packs")
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
            ? "Pack updated successfully"
            : "Pack created successfully"
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
      toast.error("Failed to save pack")
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
        `Are you sure you want to delete the ${pack.display_name_en} pack?`
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
        toast.success("Pack deleted successfully")
        fetchPacks()
      } else {
        throw new Error(result.error || "Failed to delete pack")
      }
    } catch (error) {
      console.error("Error deleting pack:", error)
      toast.error("Failed to delete pack")
    }
  }

  const formatQuotaValue = (value: number, unit?: string) => {
    if (value === -1) return "Unlimited"
    return `${value}${unit ? ` ${unit}` : ""}`
  }

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${price.toFixed(2)}`
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Subscription Packs Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage pricing tiers, features, and quotas for your subscription
            packs
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingPack(null)
                form.reset()
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Pack
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPack ? "Edit Pack" : "Create New Pack"}
              </DialogTitle>
              <DialogDescription>
                Configure the pack details, pricing, and quotas
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="quotas">Quotas</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pack Name</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
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
                            <FormLabel>Sort Order</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
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
                            <FormLabel>Display Name (English)</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <FormLabel>Display Name (French)</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <FormLabel>Description (English)</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
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
                            <FormLabel>Description (French)</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
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
                            <FormLabel>Enabled</FormLabel>
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
                            <FormLabel>Popular</FormLabel>
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
                            <FormLabel>Monthly Price ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
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
                            <FormLabel>Yearly Price ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
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
                            <FormLabel>
                              Max Projects (-1 for unlimited)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
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
                            <FormLabel>
                              Storage (GB) (-1 for unlimited)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
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
                            <FormLabel>
                              API Calls/Month (-1 for unlimited)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
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
                            <FormLabel>
                              Team Members (-1 for unlimited)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
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
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPack ? "Update Pack" : "Create Pack"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Subscription Packs
          </CardTitle>
          <CardDescription>
            Manage your subscription tiers and pricing
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
                  <TableHead>Pack</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Quotas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packs.map((pack) => (
                  <TableRow key={pack.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            {pack.display_name_en}
                            {pack.is_popular && (
                              <Badge variant="secondary">Popular</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {pack.description_en}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{formatPrice(pack.price_monthly)}/month</div>
                        <div className="text-sm text-gray-500">
                          {formatPrice(pack.price_yearly)}/year
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>
                          Projects: {formatQuotaValue(pack.quotas.projects)}
                        </div>
                        <div>
                          Storage:{" "}
                          {formatQuotaValue(pack.quotas.storage_gb, "GB")}
                        </div>
                        <div>
                          API:{" "}
                          {formatQuotaValue(
                            pack.quotas.api_calls_per_month,
                            "calls/mo"
                          )}
                        </div>
                        <div>
                          Team:{" "}
                          {formatQuotaValue(
                            pack.quotas.team_members,
                            "members"
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={pack.is_enabled ? "default" : "secondary"}
                      >
                        {pack.is_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(pack)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(pack)}
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
