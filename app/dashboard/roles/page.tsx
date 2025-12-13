"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  createdAt: string
}

const mockRoles: Role[] = [
  {
    id: "1",
    name: "超级管理员",
    description: "拥有系统所有权限",
    permissions: ["*"],
    userCount: 2,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "部门管理员",
    description: "管理部门和用户",
    permissions: ["department:read", "department:write", "user:read", "user:write"],
    userCount: 5,
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    name: "开发人员",
    description: "一般开发权限",
    permissions: ["department:read", "user:read"],
    userCount: 45,
    createdAt: "2024-01-25",
  },
  {
    id: "4",
    name: "普通员工",
    description: "基本查看权限",
    permissions: ["department:read"],
    userCount: 104,
    createdAt: "2024-02-01",
  },
]

const availablePermissions = [
  { id: "department:read", name: "查看部门", category: "部门管理" },
  { id: "department:write", name: "编辑部门", category: "部门管理" },
  { id: "department:delete", name: "删除部门", category: "部门管理" },
  { id: "user:read", name: "查看用户", category: "用户管理" },
  { id: "user:write", name: "编辑用户", category: "用户管理" },
  { id: "user:delete", name: "删除用户", category: "用户管理" },
  { id: "role:read", name: "查看角色", category: "角色管理" },
  { id: "role:write", name: "编辑角色", category: "角色管理" },
  { id: "role:delete", name: "删除角色", category: "角色管理" },
  { id: "permission:read", name: "查看权限", category: "权限管理" },
  { id: "permission:write", name: "编辑权限", category: "权限管理" },
  { id: "permission:delete", name: "删除权限", category: "权限管理" },
]

export default function RolesPage() {
  const { hasPermission } = useAuth()
  const [roles, setRoles] = useState<Role[]>(mockRoles)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })

  const canWrite = hasPermission("role:write") || hasPermission("*")
  const canDelete = hasPermission("role:delete") || hasPermission("*")

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
      })
    } else {
      setEditingRole(null)
      setFormData({ name: "", description: "", permissions: [] })
    }
    setDialogOpen(true)
  }

  const handleTogglePermission = (permissionId: string) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.includes(permissionId)
        ? formData.permissions.filter((p) => p !== permissionId)
        : [...formData.permissions, permissionId],
    })
  }

  const handleSave = () => {
    if (editingRole) {
      setRoles(
        roles.map((role) =>
          role.id === editingRole.id
            ? {
                ...role,
                name: formData.name,
                description: formData.description,
                permissions: formData.permissions,
              }
            : role,
        ),
      )
    } else {
      const newRole: Role = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        userCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setRoles([...roles, newRole])
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingRoleId) {
      setRoles(roles.filter((role) => role.id !== deletingRoleId))
      setDeleteDialogOpen(false)
      setDeletingRoleId(null)
    }
  }

  const groupedPermissions = availablePermissions.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    },
    {} as Record<string, typeof availablePermissions>,
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
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>角色名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>权限</TableHead>
                <TableHead>用户数量</TableHead>
                <TableHead>创建时间</TableHead>
                {(canWrite || canDelete) && <TableHead className="text-right">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.includes("*") ? (
                        <Badge>所有权限</Badge>
                      ) : (
                        role.permissions.slice(0, 3).map((perm) => (
                          <Badge key={perm} variant="secondary">
                            {availablePermissions.find((p) => p.id === perm)?.name || perm}
                          </Badge>
                        ))
                      )}
                      {role.permissions.length > 3 && !role.permissions.includes("*") && (
                        <Badge variant="outline">+{role.permissions.length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{role.userCount}</TableCell>
                  <TableCell>{role.createdAt}</TableCell>
                  {(canWrite || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canWrite && (
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(role)}>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "编辑角色" : "添加角色"}</DialogTitle>
            <DialogDescription>{editingRole ? "修改角色信息和权限配置" : "创建新的角色并分配权限"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入角色描述"
              />
            </div>
            <div className="space-y-3">
              <Label>权限配置</Label>
              <div className="border border-border rounded-lg p-4 space-y-4">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm">{category}</h4>
                    <div className="grid grid-cols-2 gap-3 ml-4">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={formData.permissions.includes(permission.id)}
                            onCheckedChange={() => handleTogglePermission(permission.id)}
                          />
                          <label
                            htmlFor={permission.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
