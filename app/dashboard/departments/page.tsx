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
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface Department {
  id: number
  name: string
  code: string
  description: string | null
  parentId: number | null
  parentName?: string
  manager: string | null
  phone: string | null
  email: string | null
  userCount: number
  createdAt: string
  updatedAt: string
}

export default function DepartmentsPage() {
  const { hasPermission } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
    manager: "",
    phone: "",
    email: "",
  })

  const canWrite = hasPermission("department:write") || hasPermission("*")
  const canDelete = hasPermission("department:delete") || hasPermission("*")

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/departments?page=${currentPage}&pageSize=10&search=${searchQuery}`,
      )
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setDepartments(data.data)
      setTotalPages(data.totalPages)
      setTotalCount(data.total)
    } catch (error) {
      console.error(error)
      toast.error("获取部门列表失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [currentPage, searchQuery])

  const handleOpenDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department)
      setFormData({
        name: department.name,
        description: department.description || "",
        parentId: department.parentId?.toString() || "",
        manager: department.manager || "",
        phone: department.phone || "",
        email: department.email || "",
      })
    } else {
      setEditingDepartment(null)
      setFormData({
        name: "",
        description: "",
        parentId: "",
        manager: "",
        phone: "",
        email: "",
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      if (!formData.name) {
        toast.error("部门名称不能为空")
        setSubmitting(false)
        return
      }

      const method = editingDepartment ? "PUT" : "POST"
      const body: any = {
        ...formData,
        id: editingDepartment?.id,
      }

      const res = await fetch("/api/departments", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        let errorMsg = editingDepartment ? "更新失败" : "创建失败"
        try {
          const data = JSON.parse(text)
          if (data && data.error) errorMsg = data.error
        } catch {
          if (text) errorMsg = text.slice(0, 100)
        }
        throw new Error(errorMsg)
      }

      toast.success(editingDepartment ? "更新成功" : "创建成功")
      setDialogOpen(false)
      fetchDepartments()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingDepartmentId || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/departments?id=${deletingDepartmentId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const text = await res.text()
        let errorMsg = "删除失败"
        try {
          const data = JSON.parse(text)
          if (data && data.error) errorMsg = data.error
        } catch {
          if (text) errorMsg = text.slice(0, 100)
        }
        throw new Error(errorMsg)
      }

      toast.success("删除成功")
      setDeleteDialogOpen(false)
      setDeletingDepartmentId(null)
      fetchDepartments()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">部门管理</h1>
          <p className="text-muted-foreground mt-2">管理组织架构和部门信息</p>
        </div>
        {canWrite && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            添加部门
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>部门列表</CardTitle>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="搜索部门..."
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
                  <TableHead className="text-center">部门名称</TableHead>
                  <TableHead className="w-[80px] text-center">ID</TableHead>
                  <TableHead className="text-center">上级部门</TableHead>
                  <TableHead className="text-center">负责人</TableHead>
                  <TableHead className="text-center">成员数量</TableHead>
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
                ) : departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  departments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="text-center font-medium">
                        <div>{department.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {department.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{department.id}</TableCell>
                      <TableCell className="text-center">{department.parentName || "-"}</TableCell>
                      <TableCell className="text-center">{department.manager || "-"}</TableCell>
                      <TableCell className="text-center">{department.userCount}</TableCell>
                      <TableCell className="text-center">
                        {new Date(department.createdAt).toLocaleDateString()}
                      </TableCell>
                      {(canWrite || canDelete) && (
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            {canWrite && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(department)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeletingDepartmentId(department.id)
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
        </CardContent>
        <div className="px-6 pb-6">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setCurrentPage}
          />
        </div>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!submitting) setDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "编辑部门" : "添加部门"}</DialogTitle>
            <DialogDescription>
              {editingDepartment ? "修改部门信息" : "创建新的部门"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">部门名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入部门名称"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">上级部门</Label>
              <select
                id="parent"
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                disabled={submitting}
              >
                <option value="">无上级部门</option>
                {departments
                  .filter((dept) => dept.id !== editingDepartment?.id)
                  .map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manager">负责人</Label>
                <Input
                  id="manager"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder="请输入负责人"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">联系电话</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入联系电话"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="请输入邮箱"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入部门描述"
                disabled={submitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
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
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>您确定要删除此部门吗？此操作无法撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
