"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
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

interface Department {
  id: string
  name: string
  description: string
  parentId: string | null
  parentName?: string
  memberCount: number
  createdAt: string
}

const mockDepartments: Department[] = [
  {
    id: "1",
    name: "技术部",
    description: "负责产品研发",
    parentId: null,
    memberCount: 45,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "前端组",
    description: "前端开发团队",
    parentId: "1",
    parentName: "技术部",
    memberCount: 15,
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    name: "后端组",
    description: "后端开发团队",
    parentId: "1",
    parentName: "技术部",
    memberCount: 20,
    createdAt: "2024-01-20",
  },
  {
    id: "4",
    name: "市场部",
    description: "市场营销与推广",
    parentId: null,
    memberCount: 28,
    createdAt: "2024-01-15",
  },
  {
    id: "5",
    name: "人力资源部",
    description: "人事管理",
    parentId: null,
    memberCount: 12,
    createdAt: "2024-01-15",
  },
]

export default function DepartmentsPage() {
  const { hasPermission } = useAuth()
  const [departments, setDepartments] = useState<Department[]>(mockDepartments)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
  })

  const canWrite = hasPermission("department:write") || hasPermission("*")
  const canDelete = hasPermission("department:delete") || hasPermission("*")

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleOpenDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department)
      setFormData({
        name: department.name,
        description: department.description,
        parentId: department.parentId || "",
      })
    } else {
      setEditingDepartment(null)
      setFormData({ name: "", description: "", parentId: "" })
    }
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingDepartment) {
      setDepartments(
        departments.map((dept) =>
          dept.id === editingDepartment.id
            ? {
                ...dept,
                name: formData.name,
                description: formData.description,
                parentId: formData.parentId || null,
                parentName: formData.parentId
                  ? departments.find((d) => d.id === formData.parentId)?.name
                  : undefined,
              }
            : dept,
        ),
      )
    } else {
      const newDepartment: Department = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        parentId: formData.parentId || null,
        parentName: formData.parentId
          ? departments.find((d) => d.id === formData.parentId)?.name
          : undefined,
        memberCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setDepartments([...departments, newDepartment])
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingDepartmentId) {
      setDepartments(departments.filter((dept) => dept.id !== deletingDepartmentId))
      setDeleteDialogOpen(false)
      setDeletingDepartmentId(null)
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部门名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>上级部门</TableHead>
                <TableHead>成员数量</TableHead>
                <TableHead>创建时间</TableHead>
                {(canWrite || canDelete) && <TableHead className="text-right">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>{department.description}</TableCell>
                  <TableCell>{department.parentName || "-"}</TableCell>
                  <TableCell>{department.memberCount}</TableCell>
                  <TableCell>{department.createdAt}</TableCell>
                  {(canWrite || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "编辑部门" : "添加部门"}</DialogTitle>
            <DialogDescription>
              {editingDepartment ? "修改部门信息" : "创建新的部门"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">部门名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入部门名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入部门描述"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent">上级部门</Label>
              <select
                id="parent"
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
            <DialogDescription>您确定要删除此部门吗？此操作无法撤销。</DialogDescription>
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
