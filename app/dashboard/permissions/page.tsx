"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, Shield, Loader2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface Permission {
  id: number
  code: string
  name: string
  type: string // Maps to category
  description: string
  roleCount: number
  createdAt: string
  status: string
}

const defaultCategories = ["部门管理", "用户管理", "角色管理", "权限管理", "系统管理", "其他"]

export default function PermissionsPage() {
  const { hasPermission } = useAuth()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [deletingPermissionId, setDeletingPermissionId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "",
    description: "",
    status: "active",
  })

  // Perms check
  const canWrite = hasPermission("permission:write") || hasPermission("*")
  const canDelete = hasPermission("permission:delete") || hasPermission("*")

  useEffect(() => {
    fetchPermissions()
  }, [currentPage, searchQuery, selectedCategory])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const typeParam = selectedCategory !== "all" ? `&type=${selectedCategory}` : ""
      const res = await fetch(
        `/api/permissions?page=${currentPage}&pageSize=10&search=${searchQuery}${typeParam}`,
      )
      if (res.ok) {
        const data = await res.json()
        setPermissions(data.data)
        setTotalPages(data.totalPages)
        setTotalCount(data.total)
      } else {
        toast.error("获取权限列表失败")
      }
    } catch (error) {
      console.error(error)
      toast.error("获取权限列表失败")
    } finally {
      setLoading(false)
    }
  }

  const uniqueCategories = Array.from(
    new Set([...defaultCategories, ...permissions.map((p) => p.type)]),
  )

  const categoryStats = uniqueCategories.reduce(
    (acc, category) => {
      acc[category] = permissions.filter((p) => p.type === category).length
      return acc
    },
    { all: permissions.length } as Record<string, number>,
  )

  const handleOpenDialog = (permission?: Permission) => {
    if (permission) {
      setEditingPermission(permission)
      setFormData({
        code: permission.code,
        name: permission.name,
        type: permission.type,
        description: permission.description || "",
        status: permission.status,
      })
    } else {
      setEditingPermission(null)
      setFormData({ code: "", name: "", type: "", description: "", status: "active" })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const url = "/api/permissions"
      const method = editingPermission ? "PUT" : "POST"
      const body: any = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        description: formData.description,
        status: formData.status,
      }

      if (editingPermission) {
        body.id = editingPermission.id
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingPermission ? "权限更新成功" : "权限创建成功")
        setDialogOpen(false)
        fetchPermissions()
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
    if (!deletingPermissionId) return

    try {
      const res = await fetch(`/api/permissions?id=${deletingPermissionId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("权限删除成功")
        setDeleteDialogOpen(false)
        setDeletingPermissionId(null)
        fetchPermissions()
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
          <h1 className="text-3xl font-bold">权限管理</h1>
          <p className="text-muted-foreground mt-2">管理系统权限点和访问控制</p>
        </div>
        {canWrite && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            添加权限
          </Button>
        )}
      </div>

      {/* Category Cards - limiting to top 5 to avoid clutter if dynamic types grow */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card
          className={`cursor-pointer transition-colors ${selectedCategory === "all" ? "border-primary" : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Shield className="text-primary h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{categoryStats.all}</div>
                <div className="text-muted-foreground text-sm">全部权限</div>
              </div>
            </div>
          </CardContent>
        </Card>
        {uniqueCategories.slice(0, 4).map((category) => (
          <Card
            key={category}
            className={`cursor-pointer transition-colors ${selectedCategory === category ? "border-primary" : ""}`}
            onClick={() => setSelectedCategory(category)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-muted rounded-lg p-2">
                  <Shield className="text-muted-foreground h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{categoryStats[category] || 0}</div>
                  <div className="text-muted-foreground text-sm">{category}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>权限列表</CardTitle>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="搜索权限..."
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
                  <TableHead className="text-center">权限代码</TableHead>
                  <TableHead className="text-center">权限名称</TableHead>
                  <TableHead className="text-center">分类</TableHead>
                  <TableHead className="text-center">描述</TableHead>
                  <TableHead className="text-center">关联角色</TableHead>
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
                ) : permissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="text-center font-mono text-sm">
                        {permission.code}
                      </TableCell>
                      <TableCell className="text-center font-medium">{permission.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{permission.type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-center">
                        {permission.description}
                      </TableCell>
                      <TableCell className="text-center">{permission.roleCount} 个角色</TableCell>
                      <TableCell className="text-center">
                        {new Date(permission.createdAt).toLocaleDateString()}
                      </TableCell>
                      {(canWrite || canDelete) && (
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            {canWrite && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(permission)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeletingPermissionId(permission.id)
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPermission ? "编辑权限" : "添加权限"}</DialogTitle>
            <DialogDescription>
              {editingPermission ? "修改权限信息" : "创建新的权限点，权限代码格式：模块:操作"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">权限代码</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="例如：module:action"
                className="font-mono"
                disabled={!!editingPermission}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">权限名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入权限名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <select
                id="category"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">请选择分类</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入权限描述"
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
            <DialogDescription>
              您确定要删除此权限吗？此操作无法撤销，且会影响所有关联的角色。
            </DialogDescription>
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
