"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Search, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

interface Permission {
  id: string
  code: string
  name: string
  category: string
  description: string
  roleCount: number
  createdAt: string
}

const mockPermissions: Permission[] = [
  {
    id: "1",
    code: "department:read",
    name: "查看部门",
    category: "部门管理",
    description: "允许查看部门列表和详情",
    roleCount: 4,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    code: "department:write",
    name: "编辑部门",
    category: "部门管理",
    description: "允许创建和编辑部门信息",
    roleCount: 2,
    createdAt: "2024-01-15",
  },
  {
    id: "3",
    code: "department:delete",
    name: "删除部门",
    category: "部门管理",
    description: "允许删除部门",
    roleCount: 1,
    createdAt: "2024-01-15",
  },
  {
    id: "4",
    code: "user:read",
    name: "查看用户",
    category: "用户管理",
    description: "允许查看用户列表和详情",
    roleCount: 3,
    createdAt: "2024-01-15",
  },
  {
    id: "5",
    code: "user:write",
    name: "编辑用户",
    category: "用户管理",
    description: "允许创建和编辑用户信息",
    roleCount: 2,
    createdAt: "2024-01-15",
  },
  {
    id: "6",
    code: "user:delete",
    name: "删除用户",
    category: "用户管理",
    description: "允许删除用户",
    roleCount: 1,
    createdAt: "2024-01-15",
  },
  {
    id: "7",
    code: "role:read",
    name: "查看角色",
    category: "角色管理",
    description: "允许查看角色列表和详情",
    roleCount: 2,
    createdAt: "2024-01-15",
  },
  {
    id: "8",
    code: "role:write",
    name: "编辑角色",
    category: "角色管理",
    description: "允许创建和编辑角色信息",
    roleCount: 1,
    createdAt: "2024-01-15",
  },
  {
    id: "9",
    code: "role:delete",
    name: "删除角色",
    category: "角色管理",
    description: "允许删除角色",
    roleCount: 1,
    createdAt: "2024-01-15",
  },
  {
    id: "10",
    code: "permission:read",
    name: "查看权限",
    category: "权限管理",
    description: "允许查看权限列表和详情",
    roleCount: 1,
    createdAt: "2024-01-15",
  },
  {
    id: "11",
    code: "permission:write",
    name: "编辑权限",
    category: "权限管理",
    description: "允许创建和编辑权限信息",
    roleCount: 1,
    createdAt: "2024-01-15",
  },
  {
    id: "12",
    code: "permission:delete",
    name: "删除权限",
    category: "权限管理",
    description: "允许删除权限",
    roleCount: 1,
    createdAt: "2024-01-15",
  },
]

const categories = ["部门管理", "用户管理", "角色管理", "权限管理", "系统管理", "其他"]

export default function PermissionsPage() {
  const { hasPermission } = useAuth()
  const [permissions, setPermissions] = useState<Permission[]>(mockPermissions)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [deletingPermissionId, setDeletingPermissionId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    description: "",
  })

  const canWrite = hasPermission("permission:write") || hasPermission("*")
  const canDelete = hasPermission("permission:delete") || hasPermission("*")

  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || permission.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categoryStats = categories.reduce(
    (acc, category) => {
      acc[category] = permissions.filter((p) => p.category === category).length
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
        category: permission.category,
        description: permission.description,
      })
    } else {
      setEditingPermission(null)
      setFormData({ code: "", name: "", category: "", description: "" })
    }
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingPermission) {
      setPermissions(
        permissions.map((permission) =>
          permission.id === editingPermission.id
            ? {
                ...permission,
                code: formData.code,
                name: formData.name,
                category: formData.category,
                description: formData.description,
              }
            : permission,
        ),
      )
    } else {
      const newPermission: Permission = {
        id: Date.now().toString(),
        code: formData.code,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        roleCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setPermissions([...permissions, newPermission])
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingPermissionId) {
      setPermissions(permissions.filter((permission) => permission.id !== deletingPermissionId))
      setDeleteDialogOpen(false)
      setDeletingPermissionId(null)
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

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card
          className={`cursor-pointer transition-colors ${selectedCategory === "all" ? "border-primary" : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{categoryStats.all}</div>
                <div className="text-sm text-muted-foreground">全部权限</div>
              </div>
            </div>
          </CardContent>
        </Card>
        {categories.slice(0, 4).map((category) => (
          <Card
            key={category}
            className={`cursor-pointer transition-colors ${selectedCategory === category ? "border-primary" : ""}`}
            onClick={() => setSelectedCategory(category)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{categoryStats[category] || 0}</div>
                  <div className="text-sm text-muted-foreground">{category}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>权限列表</CardTitle>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>权限代码</TableHead>
                <TableHead>权限名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>关联角色</TableHead>
                <TableHead>创建时间</TableHead>
                {(canWrite || canDelete) && <TableHead className="text-right">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell className="font-mono text-sm">{permission.code}</TableCell>
                  <TableCell className="font-medium">{permission.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{permission.category}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{permission.description}</TableCell>
                  <TableCell>{permission.roleCount} 个角色</TableCell>
                  <TableCell>{permission.createdAt}</TableCell>
                  {(canWrite || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canWrite && (
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(permission)}>
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
              ))}
            </TableBody>
          </Table>
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
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">请选择分类</option>
                {categories.map((category) => (
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
            <DialogDescription>您确定要删除此权限吗？此操作无法撤销，且会影响所有关联的角色。</DialogDescription>
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
