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
import { useI18n } from "@/lib/i18n-context"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

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
  const { t } = useI18n()
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
      toast.error(t("menu.noData"))
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
        toast.error(t("department.nameRequired"))
        setSubmitting(false)
        return
      }

      const method = editingDepartment ? "PUT" : "POST"
      const body: any = {
        ...formData,
        id: editingDepartment?.id,
      }

      if (formData.parentId) {
        body.parentId = Number(formData.parentId)
      } else {
        body.parentId = null
      }

      const res = await fetch("/api/departments", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        let errorMsg = "Error"
        try {
          const data = JSON.parse(text)
          if (data && data.error) errorMsg = data.error
        } catch {
          if (text) errorMsg = text.slice(0, 100)
        }
        throw new Error(errorMsg)
      }

      toast.success(editingDepartment ? t("department.edit") : t("department.add"))
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
        let errorMsg = "Error"
        try {
          const data = JSON.parse(text)
          if (data && data.error) errorMsg = data.error
        } catch {
          if (text) errorMsg = text.slice(0, 100)
        }
        throw new Error(errorMsg)
      }

      toast.success(t("department.deleteConfirmation"))
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
          <h1 className="text-3xl font-bold">{t("department.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("department.description")}</p>
        </div>
        {canWrite && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("department.add")}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("department.list")}</CardTitle>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder={t("department.search")}
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
                  <TableHead className="text-center">{t("department.name")}</TableHead>
                  <TableHead className="w-[80px] text-center">{t("department.id")}</TableHead>
                  <TableHead className="text-center">{t("department.parent")}</TableHead>
                  <TableHead className="text-center">{t("department.manager")}</TableHead>
                  <TableHead className="text-center">{t("department.memberCount")}</TableHead>
                  <TableHead className="text-center">{t("department.createTime")}</TableHead>
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
                ) : departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {t("menu.noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="text-center font-medium">{dept.name}</TableCell>
                      <TableCell className="text-center">{dept.id}</TableCell>
                      <TableCell className="text-center">
                        {dept.parentName ? (
                          <Badge variant="secondary">{dept.parentName}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{dept.manager || "-"}</TableCell>
                      <TableCell className="text-center">{dept.userCount}</TableCell>
                      <TableCell className="text-center">
                        {new Date(dept.createdAt).toLocaleDateString()}
                      </TableCell>
                      {(canWrite || canDelete) && (
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            {canWrite && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(dept)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeletingDepartmentId(dept.id)
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? t("department.edit") : t("department.add")}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment ? t("department.editDescription") : t("department.addDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("department.name")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("department.enterName")}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">{t("department.parent")}</Label>
              <select
                id="parent"
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                disabled={submitting}
              >
                <option value="">{t("department.noParent")}</option>
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
                <Label htmlFor="manager">{t("department.manager")}</Label>
                <Input
                  id="manager"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder={t("department.enterManager")}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("department.phone")}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t("department.enterPhone")}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("department.email")}</Label>
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
              <Label htmlFor="description">{t("common.description")}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("department.enterDescription")}
                disabled={submitting}
              />
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
            <DialogTitle>{t("department.confirmDelete")}</DialogTitle>
            <DialogDescription>{t("department.deleteConfirmation")}</DialogDescription>
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
