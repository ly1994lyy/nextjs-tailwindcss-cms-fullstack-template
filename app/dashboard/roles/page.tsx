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

interface Permission {
  id: number
  name: string
  code: string
  type: string
}

interface Role {
  id: number
  name: string
  code: string
  description: string | null
  permissions: Permission[]
  userCount: number
  createdAt: string
  status: string
}

export default function RolesPage() {
  const { hasPermission } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([])
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
    permissions: [] as number[],
    status: "active",
  })

  const canWrite = hasPermission("role:write") || hasPermission("*")
  const canDelete = hasPermission("role:delete") || hasPermission("*")

  useEffect(() => {
    fetchRoles()
  }, [currentPage, searchQuery])

  useEffect(() => {
    fetchPermissions()
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

  const fetchPermissions = async () => {
    try {
      const res = await fetch("/api/permissions?pageSize=500")
      if (res.ok) {
        const data = await res.json()
        setAvailablePermissions(data.data || [])
      } else {
        toast.error("获取权限列表失败")
      }
    } catch (error) {
      console.error("Failed to fetch permissions", error)
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
        permissions: role.permissions.map((p) => p.id),
      })
    } else {
      setEditingRole(null)
      setFormData({ name: "", code: "", description: "", status: "active", permissions: [] })
    }
    setDialogOpen(true)
  }

  const handleTogglePermission = (permissionId: number) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.includes(permissionId)
        ? formData.permissions.filter((p) => p !== permissionId)
        : [...formData.permissions, permissionId],
    })
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
        permissionIds: formData.permissions,
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

  const groupedPermissions = availablePermissions.reduce(
    (acc, permission) => {
      if (!acc[permission.type]) {
        acc[permission.type] = []
      }
      acc[permission.type].push(permission)
      return acc
    },
    {} as Record<string, Permission[]>,
  )

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
                  <TableHead className="text-center">权限</TableHead>
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
                        <div className="flex flex-wrap justify-center gap-1">
                          {role.permissions.some((p) => p.code === "*") ? (
                            <Badge>所有权限</Badge>
                          ) : (
                            role.permissions.slice(0, 3).map((perm) => (
                              <Badge key={perm.id} variant="secondary">
                                {perm.name}
                              </Badge>
                            ))
                          )}
                          {role.permissions.length > 3 &&
                            !role.permissions.some((p) => p.code === "*") && (
                              <Badge variant="outline">+{role.permissions.length - 3}</Badge>
                            )}
                        </div>
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
              <Label>权限配置</Label>
              <div className="border-border space-y-4 rounded-lg border p-4">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-medium">{category}</h4>
                    <div className="ml-4 grid grid-cols-2 gap-3">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id.toString()}
                            checked={formData.permissions.includes(permission.id)}
                            onCheckedChange={() => handleTogglePermission(permission.id)}
                          />
                          <label
                            htmlFor={permission.id.toString()}
                            className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
