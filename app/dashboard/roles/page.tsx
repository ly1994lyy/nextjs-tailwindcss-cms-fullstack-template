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
  const [formData, setFormData] = useState({
    name: "",
    code: "",
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
        toast.error("获取角色列表失败")
      }
    } catch (error) {
      console.error(error)
      toast.error("获取角色列表失败")
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
        toast.error("获取菜单列表失败")
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
        code: role.code,
        description: role.description || "",
        status: role.status,
        menuIds: role.menuIds || [],
      })
    } else {
      setEditingRole(null)
      setFormData({ name: "", code: "", description: "", status: "active", menuIds: [] })
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
                按钮
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
    try {
      const url = "/api/roles"
      const method = editingRole ? "PUT" : "POST"
      const body: any = {
        name: formData.name,
        code: formData.code,
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
        toast.success(editingRole ? "角色更新成功" : "角色创建成功")
        setDialogOpen(false)
        fetchRoles()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "操作失败")
      }
    } catch (error) {
      console.error(error)
      toast.error("操作失败")
    }
  }

  const handleDelete = async () => {
    if (!deletingRoleId) return

    try {
      const res = await fetch(`/api/roles?id=${deletingRoleId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("角色删除成功")
        setDeleteDialogOpen(false)
        setDeletingRoleId(null)
        fetchRoles()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "删除失败")
      }
    } catch (error) {
      console.error(error)
      toast.error("删除失败")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">角色管理</h1>
          <p className="text-muted-foreground mt-2">管理系统角色及其权限配置</p>
        </div>
        {canWrite && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            添加角色
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>角色列表</CardTitle>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="搜索角色..."
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
                  <TableHead className="text-center">角色名称</TableHead>
                  <TableHead className="text-center">编码</TableHead>
                  <TableHead className="text-center">描述</TableHead>
                  <TableHead className="text-center">权限菜单</TableHead>
                  <TableHead className="text-center">用户数量</TableHead>
                  <TableHead className="text-center">创建时间</TableHead>
                  {(canWrite || canDelete) && <TableHead className="text-center">操作</TableHead>}
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
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="text-center font-medium">{role.name}</TableCell>
                      <TableCell className="text-center">{role.code}</TableCell>
                      <TableCell className="text-center">{role.description}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{role.menuIds?.length || 0} 个菜单/权限</Badge>
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "编辑角色" : "添加角色"}</DialogTitle>
            <DialogDescription>
              {editingRole ? "修改角色信息和权限配置" : "创建新的角色并分配权限"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">角色名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入角色名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">角色编码</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="请输入角色编码"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入角色描述"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="active">正常</option>
                <option value="inactive">停用</option>
              </select>
            </div>
            <div className="space-y-3">
              <Label>权限菜单配置</Label>
              <div className="border-border max-h-[400px] space-y-4 overflow-y-auto rounded-lg border p-4">
                {menuTree.map((menu) => renderMenuCheckbox(menu))}
                {menuTree.length === 0 && (
                  <p className="text-muted-foreground text-sm">暂无菜单数据</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>您确定要删除此角色吗？此操作无法撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
