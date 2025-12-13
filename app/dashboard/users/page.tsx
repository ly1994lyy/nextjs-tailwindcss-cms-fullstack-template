"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Search, Mail, Phone } from "lucide-react"
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

interface User {
  id: string
  username: string
  name: string
  email: string
  phone: string
  departmentId: string
  departmentName: string
  roleId: string
  roleName: string
  status: "active" | "inactive"
  createdAt: string
}

const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    name: "系统管理员",
    email: "admin@example.com",
    phone: "13800138000",
    departmentId: "1",
    departmentName: "技术部",
    roleId: "1",
    roleName: "管理员",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    username: "zhangsan",
    name: "张三",
    email: "zhangsan@example.com",
    phone: "13800138001",
    departmentId: "2",
    departmentName: "前端组",
    roleId: "2",
    roleName: "开发人员",
    status: "active",
    createdAt: "2024-02-01",
  },
  {
    id: "3",
    username: "lisi",
    name: "李四",
    email: "lisi@example.com",
    phone: "13800138002",
    departmentId: "3",
    departmentName: "后端组",
    roleId: "2",
    roleName: "开发人员",
    status: "active",
    createdAt: "2024-02-05",
  },
  {
    id: "4",
    username: "wangwu",
    name: "王五",
    email: "wangwu@example.com",
    phone: "13800138003",
    departmentId: "4",
    departmentName: "市场部",
    roleId: "3",
    roleName: "普通员工",
    status: "inactive",
    createdAt: "2024-02-10",
  },
]

const mockDepartments = [
  { id: "1", name: "技术部" },
  { id: "2", name: "前端组" },
  { id: "3", name: "后端组" },
  { id: "4", name: "市场部" },
  { id: "5", name: "人力资源部" },
]

const mockRoles = [
  { id: "1", name: "管理员" },
  { id: "2", name: "开发人员" },
  { id: "3", name: "普通员工" },
]

export default function UsersPage() {
  const { hasPermission } = useAuth()
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    roleId: "",
    password: "",
  })

  const canWrite = hasPermission("user:write") || hasPermission("*")
  const canDelete = hasPermission("user:delete") || hasPermission("*")

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        departmentId: user.departmentId,
        roleId: user.roleId,
        password: "",
      })
    } else {
      setEditingUser(null)
      setFormData({
        username: "",
        name: "",
        email: "",
        phone: "",
        departmentId: "",
        roleId: "",
        password: "",
      })
    }
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingUser) {
      setUsers(
        users.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                username: formData.username,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                departmentId: formData.departmentId,
                departmentName: mockDepartments.find((d) => d.id === formData.departmentId)?.name || "",
                roleId: formData.roleId,
                roleName: mockRoles.find((r) => r.id === formData.roleId)?.name || "",
              }
            : user,
        ),
      )
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        username: formData.username,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        departmentId: formData.departmentId,
        departmentName: mockDepartments.find((d) => d.id === formData.departmentId)?.name || "",
        roleId: formData.roleId,
        roleName: mockRoles.find((r) => r.id === formData.roleId)?.name || "",
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
      }
      setUsers([...users, newUser])
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingUserId) {
      setUsers(users.filter((user) => user.id !== deletingUserId))
      setDeleteDialogOpen(false)
      setDeletingUserId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">用户管理</h1>
          <p className="text-muted-foreground mt-2">管理系统用户及其信息</p>
        </div>
        {canWrite && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            添加用户
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户..."
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
                <TableHead>用户名</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                {(canWrite || canDelete) && <TableHead className="text-right">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {user.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.departmentName}</TableCell>
                  <TableCell>{user.roleName}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "default" : "secondary"}>
                      {user.status === "active" ? "正常" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.createdAt}</TableCell>
                  {(canWrite || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canWrite && (
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingUserId(user.id)
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? "编辑用户" : "添加用户"}</DialogTitle>
            <DialogDescription>{editingUser ? "修改用户信息" : "创建新的用户账号"}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="请输入用户名"
                disabled={!!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="请输入邮箱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入手机号"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">所属部门</Label>
              <select
                id="department"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">请选择部门</option>
                {mockDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">角色</Label>
              <select
                id="role"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">请选择角色</option>
                {mockRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            {!editingUser && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="请输入初始密码"
                />
              </div>
            )}
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
            <DialogDescription>您确定要删除此用户吗？此操作无法撤销。</DialogDescription>
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
