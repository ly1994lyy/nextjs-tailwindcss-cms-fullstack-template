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
import { useI18n } from "@/lib/i18n-context"
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
  const { t } = useI18n()
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
  const [submitting, setSubmitting] = useState(false)
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
    if (submitting) return
    setSubmitting(true)
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
        const text = await res.text()
        let errorMsg = editingUser ? "用户更新失败" : "用户创建失败"
        try {
          const data = JSON.parse(text)
          if (data && data.error) errorMsg = data.error
        } catch {
          if (text) errorMsg = text.slice(0, 100)
        }
        console.error("Save user error:", errorMsg)
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
    if (!deletingUserId || submitting) return
    setSubmitting(true)

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
        const text = await res.text()
        let errorMsg = "删除失败"
        try {
          const data = JSON.parse(text)
          if (data && data.error) errorMsg = data.error
        } catch {
          if (text) errorMsg = text.slice(0, 100)
        }
        console.error("Delete user error:", errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error(error)
      toast.error("网络请求失败，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("user.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("user.description")}</p>
        </div>
        {canWrite && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("user.add")}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("user.list")}</CardTitle>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder={t("user.search")}
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
                  <TableHead className="text-center">{t("user.username")}</TableHead>
                  <TableHead className="text-center">{t("user.name")}</TableHead>
                  <TableHead className="text-center">{t("user.contact")}</TableHead>
                  <TableHead className="text-center">{t("user.department")}</TableHead>
                  <TableHead className="text-center">{t("user.role")}</TableHead>
                  <TableHead className="text-center">{t("user.status")}</TableHead>
                  <TableHead className="text-center">{t("user.createTime")}</TableHead>
                  {(canWrite || canDelete) && (
                    <TableHead className="text-center">{t("common.actions")}</TableHead>
                  )}
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
                      {t("menu.noData")}
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
                          {user.status === "active" ? t("user.active") : t("user.inactive")}
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
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!submitting) setDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? t("user.edit") : t("user.add")}</DialogTitle>
            <DialogDescription>
              {editingUser ? t("user.editDescription") : t("user.addDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("user.username")}</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder={t("user.enterUsername")}
                disabled={!!editingUser || submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="realName">{t("user.name")}</Label>
              <Input
                id="realName"
                value={formData.realName}
                onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                placeholder={t("user.enterName")}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("user.email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t("department.enterEmail")}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("user.mobile")}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t("user.enterMobile")}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">{t("user.department")}</Label>
              <select
                id="department"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                disabled={submitting}
              >
                <option value="">{t("user.selectDepartment")}</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t("user.role")}</Label>
              <select
                id="role"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                disabled={submitting}
              >
                <option value="">{t("user.selectRole")}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
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
            {!editingUser ? (
              <div className="col-span-1 space-y-2">
                <Label htmlFor="password">{t("user.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t("user.initialPassword")}
                  disabled={submitting}
                />
              </div>
            ) : (
              <div className="col-span-1 space-y-2">
                <Label htmlFor="password">{t("user.passwordPlaceholder")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t("user.newPassword")}
                  disabled={submitting}
                />
              </div>
            )}
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
            <DialogTitle>{t("user.confirmDelete")}</DialogTitle>
            <DialogDescription>{t("user.deleteConfirmation")}</DialogDescription>
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
