"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react"
import { PaginationControls } from "@/components/pagination-controls"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n-context"
import { toast } from "sonner"

interface Menu {
  id: number
  name: string
  parentId: number | null
  type: string
  children?: Menu[]
}

interface Role {
  id: number
  name: string
  code: string
  description: string | null
  menuIds: number[]
  userCount: number
  createdAt: string
  status: string
}

export default function RolesPage() {
  const { hasPermission } = useAuth()
  const { t } = useI18n()
  const [roles, setRoles] = useState<Role[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    menuIds: [] as number[],
    status: "active",
  })

  const canWrite = hasPermission("role:write") || hasPermission("*")
  const canDelete = hasPermission("role:delete") || hasPermission("*")

  useEffect(() => {
    fetchRoles()
  }, [currentPage, searchQuery])

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/roles?page=${currentPage}&pageSize=10&search=${searchQuery}`)
      if (res.ok) {
        const data = await res.json()
        setRoles(data.data)
        setTotalPages(data.totalPages)
        setTotalCount(data.total)
      } else {
        toast.error(t("menu.noData"))
      }
    } catch (error) {
      console.error(error)
      toast.error(t("menu.noData"))
    } finally {
      setLoading(false)
    }
  }

  const fetchMenus = async () => {
    try {
      const res = await fetch("/api/menus")
      if (res.ok) {
        const data = await res.json()
        setMenus(data)
      } else {
        toast.error(t("menu.noData"))
      }
    } catch (error) {
      console.error("Failed to fetch menus", error)
    }
  }

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        description: role.description || "",
        status: role.status,
        menuIds: role.menuIds || [],
      })
    } else {
      setEditingRole(null)
      setFormData({ name: "", description: "", status: "active", menuIds: [] })
    }
    setDialogOpen(true)
  }

  // Build Tree
  const buildTree = (items: Menu[]): Menu[] => {
    const map = new Map<number, Menu>()
    const roots: Menu[] = []
    // Deep copy
    const nodes = items.map((item) => ({ ...item, children: [] }))
    nodes.forEach((item) => map.set(item.id, item))
    nodes.forEach((item) => {
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children!.push(item)
      } else {
        roots.push(item)
      }
    })
    return roots
  }

  const menuTree = buildTree(menus)

  const handleToggleMenu = (menuId: number, checked: boolean) => {
    let newMenuIds = new Set(formData.menuIds)

    // Helper to process children recursively
    const toggleChildren = (parentId: number, check: boolean) => {
      const children = menus.filter((m) => m.parentId === parentId)
      children.forEach((child) => {
        if (check) newMenuIds.add(child.id)
        else newMenuIds.delete(child.id)
        toggleChildren(child.id, check)
      })
    }

    if (checked) {
      newMenuIds.add(menuId)
      toggleChildren(menuId, true)

      // Auto-check parents
      let current = menus.find((m) => m.id === menuId)
      while (current && current.parentId) {
        newMenuIds.add(current.parentId)
        current = menus.find((m) => m.id === current!.parentId)
      }
    } else {
      newMenuIds.delete(menuId)
      toggleChildren(menuId, false)
    }

    setFormData({ ...formData, menuIds: Array.from(newMenuIds) })
  }

  // Recursive Tree Renderer for Checkboxes
  const renderMenuCheckbox = (menu: Menu, level = 0) => {
    const hasChildren = menu.children && menu.children.length > 0
    return (
      <div key={menu.id} style={{ marginLeft: level * 20 }} className="py-1">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`menu-${menu.id}`}
            checked={formData.menuIds.includes(menu.id)}
            onCheckedChange={(checked) => handleToggleMenu(menu.id, checked as boolean)}
          />
          <label
            htmlFor={`menu-${menu.id}`}
            className="flex cursor-pointer items-center gap-2 text-sm leading-none font-medium"
          >
            {menu.name}
            {menu.type === "button" && (
              <Badge
                variant="outline"
                className="h-4 border-blue-200 bg-blue-50 px-1 py-0 text-[10px] text-blue-700"
              >
                {t("role.button")}
              </Badge>
            )}
          </label>
        </div>
        {hasChildren && (
          <div className="border-muted mt-1 ml-2 border-l">
            {menu.children!.map((child) => renderMenuCheckbox(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const handleSave = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const url = "/api/roles"
      const method = editingRole ? "PUT" : "POST"
      const body: any = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        menuIds: formData.menuIds,
      }

      if (editingRole) {
        body.id = editingRole.id
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingRole ? t("role.editDescription") : t("role.addDescription"))
        setDialogOpen(false)
        fetchRoles()
      } else {
        const text = await res.text()
        let errorMsg = "Error"
        try {
          const data = JSON.parse(text)
          if (data && data.error) errorMsg = data.error
        } catch {
          if (text) errorMsg = text.slice(0, 100)
        }
        console.error("Save role error:", errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error(error)
      toast.error(t("menu.noData"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingRoleId || submitting) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/roles?id=${deletingRoleId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success(t("role.deleteConfirmation"))
        setDeleteDialogOpen(false)
        setDeletingRoleId(null)
        fetchRoles()
      } else {
        const text = await res.text()
        let errorMsg = "Delete failed"
        try {
          const data = JSON.parse(text)
          if (data && data.error) errorMsg = data.error
        } catch {
          if (text) errorMsg = text.slice(0, 100)
        }
        console.error("Delete role error:", errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error(error)
      toast.error(t("menu.noData"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("role.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("role.description")}</p>
        </div>
        {canWrite && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("role.add")}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("role.list")}</CardTitle>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder={t("role.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">{t("role.name")}</TableHead>
                  <TableHead className="w-[80px] text-center">{t("role.id")}</TableHead>
                  <TableHead className="text-center">{t("role.desc")}</TableHead>
                  <TableHead className="text-center">{t("role.permissions")}</TableHead>
                  <TableHead className="text-center">{t("role.userCount")}</TableHead>
                  <TableHead className="text-center">{t("role.createTime")}</TableHead>
                  {(canWrite || canDelete) && (
                    <TableHead className="text-center">{t("common.actions")}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {t("menu.noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="text-center font-medium">{role.name}</TableCell>
                      <TableCell className="text-center">{role.id}</TableCell>
                      <TableCell className="text-center">{role.description}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {role.menuIds?.length || 0} {t("role.menuPermissionCount")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{role.userCount}</TableCell>
                      <TableCell className="text-center">
                        {new Date(role.createdAt).toLocaleDateString()}
                      </TableCell>
                      {(canWrite || canDelete) && (
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            {canWrite && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(role)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeletingRoleId(role.id)
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
          <div className="mt-4">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!submitting) setDialogOpen(open)
        }}
      >
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? t("role.edit") : t("role.add")}</DialogTitle>
            <DialogDescription>
              {editingRole ? t("role.editDescription") : t("role.addDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("role.name")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("role.enterName")}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("role.desc")}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("role.enterDescription")}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t("user.status")}</Label>
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
            <div className="space-y-3">
              <Label>{t("role.permissionConfig")}</Label>
              <div className="border-border max-h-[400px] space-y-4 overflow-y-auto rounded-lg border p-4">
                {menuTree.map((menu) => renderMenuCheckbox(menu))}
                {menuTree.length === 0 && (
                  <p className="text-muted-foreground text-sm">{t("role.noMenuData")}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
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
            <DialogTitle>{t("role.confirmDelete")}</DialogTitle>
            <DialogDescription>{t("role.deleteConfirmation")}</DialogDescription>
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
