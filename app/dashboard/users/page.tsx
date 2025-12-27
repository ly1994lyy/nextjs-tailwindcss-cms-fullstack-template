"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, Mail, Phone, Loader2 } from "lucide-react"
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

interface Role {
  id: number
  name: string
  code: string
}

interface User {
  id: number
  username: string
  realName: string
  email: string | null
  phone: string | null
  departmentId: number | null
  departmentName?: string
  roles: Role[]
  status: "active" | "inactive" | string
  createdAt: string
}

interface Department {
  id: number
  name: string
}

export default function UsersPage() {
  const { hasPermission } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    realName: "",
    email: "",
    phone: "",
    departmentId: "",
    roleId: "",
    password: "",
    status: "active",
  })

  // Perms check - temporary workaround if auth isn't fully ready, defaulting to true or checking specific perms
  const canWrite = hasPermission("user:write") || hasPermission("*")
  const canDelete = hasPermission("user:delete") || hasPermission("*")

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchQuery])

  useEffect(() => {
    fetchDepartments()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/users?page=${currentPage}&pageSize=10&search=${searchQuery}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data)
        setTotalPages(data.totalPages)
        setTotalCount(data.total)
      } else {
        toast.error("获取用户列表失败")
      }
    } catch (error) {
      console.error(error)
      toast.error("获取用户列表失败")
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments?pageSize=100")
      if (res.ok) {
        const data = await res.json()
        setDepartments(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch departments", error)
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles?pageSize=100")
      if (res.ok) {
        const data = await res.json()
        setRoles(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch roles", error)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.realName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        realName: user.realName,
        email: user.email || "",
        phone: user.phone || "",
        departmentId: user.departmentId?.toString() || "",
        roleId: user.roles && user.roles.length > 0 ? user.roles[0].id.toString() : "",
        password: "",
        status: user.status,
      })
    } else {
      setEditingUser(null)
      setFormData({
        username: "",
        realName: "",
        email: "",
        phone: "",
        departmentId: "",
        roleId: "",
        password: "",
        status: "active",
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const url = "/api/users"
      const method = editingUser ? "PUT" : "POST"
      const body: any = {
        username: formData.username,
        realName: formData.realName,
        email: formData.email || null,
        phone: formData.phone || null,
        departmentId: formData.departmentId || null,
        roleIds: formData.roleId ? [formData.roleId] : [], // Send as array
        status: formData.status,
      }

      if (editingUser) {
        body.id = editingUser.id
        // Only include password if it's set
        if (formData.password) {
          body.password = formData.password
        }
      } else {
        body.password = formData.password // Required for create
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingUser ? "用户更新成功" : "用户创建成功")
        setDialogOpen(false)
        fetchUsers()
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
    if (!deletingUserId) return

    try {
      const res = await fetch(`/api/users?id=${deletingUserId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("用户删除成功")
        setDeleteDialogOpen(false)
        setDeletingUserId(null)
        fetchUsers()
      } else {
        toast.error("删除失败")
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
          <div className="mt-4 flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">用户名</TableHead>
                  <TableHead className="text-center">姓名</TableHead>
                  <TableHead className="text-center">联系方式</TableHead>
                  <TableHead className="text-center">部门</TableHead>
                  <TableHead className="text-center">角色</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="text-center">创建时间</TableHead>
                  {(canWrite || canDelete) && <TableHead className="text-center">操作</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-center font-medium">{user.username}</TableCell>
                      <TableCell className="text-center">{user.realName}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          {user.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="text-muted-foreground h-3 w-3" />
                              {user.email}
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="text-muted-foreground h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                          {!user.email && !user.phone && <span>-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{user.departmentName || "-"}</TableCell>
                      <TableCell className="text-center">
                        {(user.roles && user.roles.map((r) => r.name).join(", ")) || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>
                          {user.status === "active" ? "正常" : "停用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      {(canWrite || canDelete) && (
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            {canWrite && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(user)}
                              >
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? "编辑用户" : "添加用户"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "修改用户信息" : "创建新的用户账号"}
            </DialogDescription>
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
              <Label htmlFor="realName">姓名</Label>
              <Input
                id="realName"
                value={formData.realName}
                onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
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
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">请选择部门</option>
                {departments.map((dept) => (
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
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">请选择角色</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
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
            {!editingUser ? (
              <div className="col-span-1 space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="请输入初始密码"
                />
              </div>
            ) : (
              <div className="col-span-1 space-y-2">
                <Label htmlFor="password">密码 (留空不修改)</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="请输入新密码"
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
