"use client"

import { useState } from "react"
import { Plus, Search, Pencil, Trash2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"

interface Menu {
  id: string
  name: string
  path?: string
  icon: string
  parentId: string | null
  sort: number
  visible: boolean
  permission?: string
  type: "directory" | "menu"
}

// 模拟数据
const initialMenus: Menu[] = [
  {
    id: "1",
    name: "仪表板",
    path: "/dashboard",
    icon: "LayoutDashboard",
    parentId: null,
    sort: 1,
    visible: true,
    type: "menu",
  },
  { id: "2", name: "系统管理", icon: "Settings", parentId: null, sort: 2, visible: true, type: "directory" },
  {
    id: "3",
    name: "部门管理",
    path: "/dashboard/departments",
    icon: "Building2",
    parentId: "2",
    sort: 1,
    visible: true,
    permission: "department:read",
    type: "menu",
  },
  {
    id: "4",
    name: "用户管理",
    path: "/dashboard/users",
    icon: "Users",
    parentId: "2",
    sort: 2,
    visible: true,
    permission: "user:read",
    type: "menu",
  },
  {
    id: "5",
    name: "角色管理",
    path: "/dashboard/roles",
    icon: "Shield",
    parentId: "2",
    sort: 3,
    visible: true,
    permission: "role:read",
    type: "menu",
  },
  {
    id: "6",
    name: "权限管理",
    path: "/dashboard/permissions",
    icon: "Lock",
    parentId: "2",
    sort: 4,
    visible: true,
    permission: "permission:read",
    type: "menu",
  },
  { id: "7", name: "开发管理", icon: "Code", parentId: null, sort: 3, visible: true, type: "directory" },
  {
    id: "8",
    name: "菜单管理",
    path: "/dashboard/menus",
    icon: "Menu",
    parentId: "7",
    sort: 1,
    visible: true,
    permission: "menu:read",
    type: "menu",
  },
]

export default function MenusPage() {
  const { hasPermission } = useAuth()
  const [menus, setMenus] = useState<Menu[]>(initialMenus)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(["2", "7"]))

  // 表单状态
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    icon: "",
    parentId: "0", // Updated default value to be a non-empty string
    sort: 0,
    visible: true,
    permission: "",
    type: "menu" as "directory" | "menu",
  })

  // 构建树形结构
  const buildTree = (items: Menu[]): Menu[] => {
    const map = new Map<string, Menu & { children?: Menu[] }>()
    const roots: (Menu & { children?: Menu[] })[] = []

    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] })
    })

    items.forEach((item) => {
      const node = map.get(item.id)!
      if (item.parentId) {
        const parent = map.get(item.parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    // 排序
    const sortNodes = (nodes: (Menu & { children?: Menu[] })[]) => {
      nodes.sort((a, b) => a.sort - b.sort)
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortNodes(node.children)
        }
      })
    }

    sortNodes(roots)
    return roots
  }

  const filteredMenus = menus.filter(
    (menu) =>
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.path?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const menuTree = buildTree(filteredMenus)

  const handleAdd = () => {
    setEditingMenu(null)
    setFormData({
      name: "",
      path: "",
      icon: "",
      parentId: "0", // Updated default value to be a non-empty string
      sort: 0,
      visible: true,
      permission: "",
      type: "menu",
    })
    setDialogOpen(true)
  }

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu)
    setFormData({
      name: menu.name,
      path: menu.path || "",
      icon: menu.icon,
      parentId: menu.parentId || "0", // Updated default value to be a non-empty string
      sort: menu.sort,
      visible: menu.visible,
      permission: menu.permission || "",
      type: menu.type,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    // 检查是否有子菜单
    const hasChildren = menus.some((m) => m.parentId === id)
    if (hasChildren) {
      alert("该菜单下还有子菜单，无法删除")
      return
    }
    setMenus(menus.filter((m) => m.id !== id))
  }

  const handleSubmit = () => {
    if (editingMenu) {
      setMenus(menus.map((m) => (m.id === editingMenu.id ? { ...m, ...formData } : m)))
    } else {
      const newMenu: Menu = {
        id: Date.now().toString(),
        ...formData,
        parentId: formData.parentId || null,
      }
      setMenus([...menus, newMenu])
    }
    setDialogOpen(false)
  }

  const toggleExpand = (id: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // 渲染树形菜单
  const renderMenuTree = (items: (Menu & { children?: Menu[] })[], level = 0) => {
    return items.map((menu) => (
      <div key={menu.id}>
        <div
          className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg group"
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        >
          {menu.children && menu.children.length > 0 && (
            <button onClick={() => toggleExpand(menu.id)} className="p-0.5 hover:bg-background rounded">
              <ChevronRight
                className={`h-4 w-4 transition-transform ${expandedMenus.has(menu.id) ? "rotate-90" : ""}`}
              />
            </button>
          )}
          {(!menu.children || menu.children.length === 0) && <div className="w-5" />}

          <div className="flex-1 flex items-center gap-3">
            <div className="font-medium">{menu.name}</div>
            {menu.type === "directory" ? (
              <Badge variant="secondary">目录</Badge>
            ) : (
              <Badge variant="outline">菜单</Badge>
            )}
            {menu.path && <div className="text-sm text-muted-foreground">{menu.path}</div>}
            {menu.permission && (
              <Badge variant="outline" className="text-xs">
                {menu.permission}
              </Badge>
            )}
            {!menu.visible && <Badge variant="destructive">隐藏</Badge>}
          </div>

          {hasPermission("menu:write") && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(menu)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(menu.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {menu.children && menu.children.length > 0 && expandedMenus.has(menu.id) && (
          <div>{renderMenuTree(menu.children, level + 1)}</div>
        )}
      </div>
    ))
  }

  // 获取可选的父菜单（排除自己和自己的子孙）
  const getAvailableParents = () => {
    if (!editingMenu) return menus.filter((m) => m.type === "directory")

    const excludeIds = new Set<string>([editingMenu.id])
    const addChildren = (parentId: string) => {
      menus.forEach((m) => {
        if (m.parentId === parentId) {
          excludeIds.add(m.id)
          addChildren(m.id)
        }
      })
    }
    addChildren(editingMenu.id)

    return menus.filter((m) => !excludeIds.has(m.id) && m.type === "directory")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">菜单管理</h1>
        <p className="text-muted-foreground mt-2">管理系统菜单结构和权限</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>总菜单数</CardDescription>
            <CardTitle className="text-3xl">{menus.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>目录数量</CardDescription>
            <CardTitle className="text-3xl">{menus.filter((m) => m.type === "directory").length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>菜单项数量</CardDescription>
            <CardTitle className="text-3xl">{menus.filter((m) => m.type === "menu").length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>隐藏菜单</CardDescription>
            <CardTitle className="text-3xl">{menus.filter((m) => !m.visible).length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索菜单名称或路径..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {hasPermission("menu:write") && (
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                新增菜单
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">{renderMenuTree(menuTree)}</div>
        </CardContent>
      </Card>

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMenu ? "编辑菜单" : "新增菜单"}</DialogTitle>
            <DialogDescription>{editingMenu ? "修改菜单信息" : "填写菜单信息"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>菜单类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "directory" | "menu") => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="directory">目录</SelectItem>
                  <SelectItem value="menu">菜单</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>菜单名称</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入菜单名称"
              />
            </div>
            {formData.type === "menu" && (
              <div className="space-y-2">
                <Label>菜单路径</Label>
                <Input
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="/dashboard/example"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>图标</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="lucide-react 图标名称"
              />
            </div>
            <div className="space-y-2">
              <Label>父菜单</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => setFormData({ ...formData, parentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="无（顶级菜单）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">无（顶级菜单）</SelectItem> // Updated value prop to be a non-empty string
                  {getAvailableParents().map((menu) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.type === "menu" && (
              <div className="space-y-2">
                <Label>权限标识</Label>
                <Input
                  value={formData.permission}
                  onChange={(e) => setFormData({ ...formData, permission: e.target.value })}
                  placeholder="例如: menu:read"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>排序</Label>
              <Input
                type="number"
                value={formData.sort}
                onChange={(e) => setFormData({ ...formData, sort: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="visible"
                checked={formData.visible}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="visible">显示菜单</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
