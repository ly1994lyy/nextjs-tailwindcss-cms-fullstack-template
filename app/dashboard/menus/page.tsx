"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Pencil, Trash2, ChevronRight, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n-context"
import { toast } from "sonner"

interface Menu {
  id: number
  name: string
  path: string | null
  icon: string | null
  parentId: number | null
  type: string
  permissionCode: string | null
  sortOrder: number
  status: string
  // Helper for tree
  children?: Menu[]
}

export default function MenusPage() {
  const { hasPermission } = useAuth()
  const { t } = useI18n()
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [deletingMenuId, setDeletingMenuId] = useState<number | null>(null)
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    icon: "",
    parentId: "0",
    sortOrder: 0,
    status: "active",
    permissionCode: "",
    type: "menu",
  })

  // Check perms
  const canWrite = hasPermission("menu:write") || hasPermission("*")
  const canDelete = hasPermission("menu:delete") || hasPermission("*")

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/menus")
      if (res.ok) {
        const data = await res.json()
        setMenus(data)
        // Expand all by default or top level
        // const topLevelIds = data.filter((m: Menu) => !m.parentId).map((m: Menu) => m.id)
        // setExpandedMenus(new Set(topLevelIds))
      } else {
        toast.error("获取菜单列表失败")
      }
    } catch (error) {
      console.error(error)
      toast.error("获取菜单列表失败")
    } finally {
      setLoading(false)
    }
  }

  // Build Tree
  const buildTree = (items: Menu[]): Menu[] => {
    const map = new Map<number, Menu>()
    const roots: Menu[] = []

    // Deep copy to avoid mutating state directly in a way that affects other renders if not careful
    // But here we are building a new tree structure for render
    const nodes = items.map((item) => ({ ...item, children: [] }))

    nodes.forEach((item) => {
      map.set(item.id, item)
    })

    nodes.forEach((item) => {
      if (item.parentId && map.has(item.parentId)) {
        const parent = map.get(item.parentId)
        parent!.children!.push(item)
      } else {
        roots.push(item)
      }
    })

    return roots
  }

  const filteredMenus = menus.filter(
    (menu) =>
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (menu.path && menu.path.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const menuTree = buildTree(filteredMenus)

  const handleAdd = () => {
    setEditingMenu(null)
    setFormData({
      name: "",
      path: "",
      icon: "",
      parentId: "0",
      sortOrder: 0,
      status: "active",
      permissionCode: "",
      type: "menu",
    })
    setDialogOpen(true)
  }

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu)
    setFormData({
      name: menu.name,
      path: menu.path || "",
      icon: menu.icon || "",
      parentId: menu.parentId ? menu.parentId.toString() : "0",
      sortOrder: menu.sortOrder,
      status: menu.status,
      permissionCode: menu.permissionCode || "",
      type: menu.type,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const url = "/api/menus"
      const method = editingMenu ? "PUT" : "POST"
      const body: any = {
        name: formData.name,
        path: formData.path,
        icon: formData.icon,
        parentId: formData.parentId === "0" ? null : formData.parentId,
        type: formData.type,
        permissionCode: formData.permissionCode,
        sortOrder: formData.sortOrder,
        status: formData.status,
      }

      if (editingMenu) {
        body.id = editingMenu.id
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingMenu ? "菜单更新成功" : "菜单创建成功")
        setDialogOpen(false)
        fetchMenus()
      } else {
        const text = await res.text()
        let errorMsg = editingMenu ? "菜单更新失败" : "菜单创建失败"
        try {
          const data = JSON.parse(text)
          if (data && data.error) errorMsg = data.error
        } catch {
          if (text) errorMsg = text.slice(0, 100) // Fallback to raw text if not JSON
        }

        console.error("Save menu error:", errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error(error)
      toast.error("网络请求失败，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingMenuId || submitting) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/menus?id=${deletingMenuId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("菜单删除成功")
        setDeleteDialogOpen(false)
        setDeletingMenuId(null)
        fetchMenus()
      } else {
        const text = await res.text()
        let errorMsg = "删除失败"
        try {
          const data = JSON.parse(text)
          if (data && data.error) errorMsg = data.error
        } catch {
          if (text) errorMsg = text.slice(0, 100)
        }

        console.error("Delete menu error:", errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error(error)
      toast.error("网络请求失败，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Flatten tree for table rendering
  const getFlattenedRows = (
    nodes: Menu[],
    level = 0,
    result: { item: Menu; level: number }[] = [],
  ) => {
    nodes.forEach((node) => {
      result.push({ item: node, level })
      if (node.children && node.children.length > 0 && expandedMenus.has(node.id)) {
        getFlattenedRows(node.children, level + 1, result)
      }
    })
    return result
  }

  const flattenedRows = getFlattenedRows(menuTree)

  // Get available parents (exclude self and children to prevent cycles)
  const getAvailableParents = () => {
    // Basic cycle prevention: cannot set parent to self.
    // Also buttons cannot be parents.

    // Filter out buttons from potential parents
    let candidates = menus.filter((m) => m.type !== "button")

    if (!editingMenu) return candidates

    // Recursively find descendants to exclude
    const getDescendants = (parentId: number): number[] => {
      const children = menus.filter((m) => m.parentId === parentId)
      let descendants: number[] = children.map((c) => c.id)
      children.forEach((c) => {
        descendants = [...descendants, ...getDescendants(c.id)]
      })
      return descendants
    }

    const descendants = getDescendants(editingMenu.id)
    const excludeIds = new Set([editingMenu.id, ...descendants])

    return candidates.filter((m) => !excludeIds.has(m.id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("menu.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("menu.description")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t("menu.total")}</CardDescription>
            <CardTitle className="text-3xl">{menus.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t("menu.directoryCount")}</CardDescription>
            <CardTitle className="text-3xl">
              {menus.filter((m) => m.type === "directory").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t("menu.menuCount")}</CardDescription>
            <CardTitle className="text-3xl">
              {menus.filter((m) => m.type === "menu").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t("menu.buttonCount")}</CardDescription>
            <CardTitle className="text-3xl">
              {menus.filter((m) => m.type === "button").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Operation Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  placeholder={t("menu.search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {canWrite && (
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                {t("menu.add")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">{t("menu.name")}</TableHead>
                    <TableHead className="text-center">{t("menu.type")}</TableHead>
                    <TableHead className="text-center">{t("menu.path")}</TableHead>
                    <TableHead className="text-center">{t("menu.permission")}</TableHead>
                    <TableHead className="text-center">{t("menu.sort")}</TableHead>
                    <TableHead className="text-center">{t("menu.status")}</TableHead>
                    {(canWrite || canDelete) && (
                      <TableHead className="text-center">{t("common.actions")}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flattenedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        {t("menu.noData")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    flattenedRows.map(({ item: menu, level }) => (
                      <TableRow key={menu.id}>
                        <TableCell>
                          <div
                            className="flex items-center gap-2"
                            style={{ paddingLeft: `${level * 2}rem` }}
                          >
                            {menu.children && menu.children.length > 0 ? (
                              <button
                                onClick={() => toggleExpand(menu.id)}
                                className="hover:bg-muted rounded p-1"
                              >
                                {expandedMenus.has(menu.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <div className="w-6" /> // Placeholder for indent alignment
                            )}
                            <span className="font-medium">{menu.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {menu.type === "directory" ? (
                            <Badge variant="secondary">{t("menu.directory")}</Badge>
                          ) : menu.type === "button" ? (
                            <Badge
                              variant="outline"
                              className="border-blue-200 bg-blue-50 text-blue-700"
                            >
                              {t("menu.button")}
                            </Badge>
                          ) : (
                            <Badge variant="outline">{t("menu.item")}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-center text-sm">
                          {menu.path || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {menu.permissionCode ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {menu.permissionCode}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center">{menu.sortOrder}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={menu.status === "active" ? "default" : "secondary"}>
                            {menu.status === "active" ? t("user.active") : t("user.inactive")}
                          </Badge>
                        </TableCell>
                        {(canWrite || canDelete) && (
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              {canWrite && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(menu)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setDeletingMenuId(menu.id)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!submitting) setDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMenu ? t("menu.edit") : t("menu.add")}</DialogTitle>
            <DialogDescription>
              {editingMenu ? t("menu.editDescription") : t("menu.addDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("menu.selectType")}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="directory">{t("menu.directory")}</SelectItem>
                  <SelectItem value="menu">{t("menu.item")}</SelectItem>
                  <SelectItem value="button">{t("menu.button")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("menu.name")}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={
                  formData.type === "button" ? t("menu.exampleAddUser") : t("menu.enterName")
                }
                disabled={submitting}
              />
            </div>
            {formData.type !== "button" && (
              <div className="space-y-2">
                <Label>{t("menu.menuPath")}</Label>
                <Input
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="/dashboard/example"
                  disabled={submitting}
                />
              </div>
            )}
            {formData.type !== "button" && (
              <div className="space-y-2">
                <Label>{t("menu.icon")}</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder={t("menu.iconPlaceholder")}
                  disabled={submitting}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("menu.parent")}</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("menu.topLevel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t("menu.topLevel")}</SelectItem>
                  {getAvailableParents().map((menu) => (
                    <SelectItem key={menu.id} value={menu.id.toString()}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(formData.type === "menu" || formData.type === "button") && (
              <div className="space-y-2">
                <Label>{t("menu.permission")}</Label>
                <Input
                  value={formData.permissionCode}
                  onChange={(e) => setFormData({ ...formData, permissionCode: e.target.value })}
                  placeholder={t("menu.examplePermission")}
                  disabled={submitting}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("menu.sort")}</Label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t("menu.status")}</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                disabled={submitting}
              >
                <option value="active">{t("user.active")}</option>
                <option value="inactive">{t("user.inactive")}</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!submitting) setDeleteDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("menu.confirmDelete")}</DialogTitle>
            <DialogDescription>{t("menu.deleteConfirmation")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
