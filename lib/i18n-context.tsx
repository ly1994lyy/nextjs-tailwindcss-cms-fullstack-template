"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "zh" | "en"

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const translations = {
  zh: {
    // 通用
    "common.search": "搜索",
    "common.add": "新增",
    "common.edit": "编辑",
    "common.delete": "删除",
    "common.cancel": "取消",
    "common.confirm": "确认",
    "common.save": "保存",
    "common.actions": "操作",
    "common.status": "状态",
    "common.description": "描述",
    "common.welcome": "欢迎回来",

    // 菜单
    "menu.dashboard": "仪表板",
    "menu.system": "系统管理",
    "menu.departments": "部门管理",
    "menu.users": "用户管理",
    "menu.roles": "角色管理",
    "menu.permissions": "权限管理",
    "menu.development": "开发管理",
    "menu.menus": "菜单管理",
    "menu.settings": "系统设置",

    // 用户
    "user.myAccount": "我的账户",
    "user.logout": "退出登录",
    "user.profile": "个人资料",

    // 部门管理
    "department.title": "部门管理",
    "department.description": "管理组织架构和部门信息",
    "department.list": "部门列表",
    "department.search": "搜索部门...",
    "department.name": "部门名称",
    "department.id": "ID",
    "department.parent": "上级部门",
    "department.manager": "负责人",
    "department.memberCount": "成员数量",
    "department.createTime": "创建时间",
    "department.noParent": "无上级部门",
    "department.edit": "编辑部门",
    "department.add": "添加部门",
    "department.editDescription": "修改部门信息",
    "department.addDescription": "创建新的部门",
    "department.confirmDelete": "确认删除",
    "department.deleteConfirmation": "您确定要删除此部门吗？此操作无法撤销。",
    "department.nameRequired": "部门名称不能为空",
    "department.enterName": "请输入部门名称",
    "department.enterManager": "请输入负责人",
    "department.enterPhone": "请输入联系电话",
    "department.enterEmail": "请输入邮箱",
    "department.enterDescription": "请输入部门描述",
    "department.phone": "联系电话",
    "department.email": "邮箱",

    // 角色管理
    "role.title": "角色管理",
    "role.description": "管理系统角色及其权限配置",
    "role.list": "角色列表",
    "role.search": "搜索角色...",
    "role.name": "角色名称",
    "role.id": "ID",
    "role.desc": "描述",
    "role.permissions": "权限菜单",
    "role.userCount": "用户数量",
    "role.createTime": "创建时间",
    "role.edit": "编辑角色",
    "role.add": "添加角色",
    "role.editDescription": "修改角色信息和权限配置",
    "role.addDescription": "创建新的角色并分配权限",
    "role.confirmDelete": "确认删除",
    "role.deleteConfirmation": "您确定要删除此角色吗？此操作无法撤销。",
    "role.enterName": "请输入角色名称",
    "role.enterDescription": "请输入角色描述",
    "role.permissionConfig": "权限菜单配置",
    "role.noMenuData": "暂无菜单数据",
    "role.button": "按钮",
    "role.menuPermissionCount": "个菜单/权限",

    // 用户管理
    "user.title": "用户管理",
    "user.description": "管理系统用户及其信息",
    "user.list": "用户列表",
    "user.search": "搜索用户...",
    "user.username": "用户名",
    "user.name": "姓名",
    "user.contact": "联系方式",
    "user.department": "部门",
    "user.role": "角色",
    "user.status": "状态",
    "user.createTime": "创建时间",
    "user.edit": "编辑用户",
    "user.add": "添加用户",
    "user.editDescription": "修改用户信息",
    "user.addDescription": "创建新的用户账号",
    "user.confirmDelete": "确认删除",
    "user.deleteConfirmation": "您确定要删除此用户吗？此操作无法撤销。",
    "user.enterUsername": "请输入用户名",
    "user.enterName": "请输入姓名",
    "user.mobile": "手机号",
    "user.enterMobile": "请输入手机号",
    "user.selectDepartment": "请选择部门",
    "user.selectRole": "请选择角色",
    "user.password": "密码",
    "user.initialPassword": "请输入初始密码",
    "user.newPassword": "请输入新密码",
    "user.passwordPlaceholder": "密码 (留空不修改)",
    "user.active": "正常",
    "user.inactive": "停用",

    // 菜单管理
    "menu.title": "菜单管理",
    "menu.description": "管理系统菜单结构和权限",
    "menu.total": "总菜单数",
    "menu.directoryCount": "目录数量",
    "menu.menuCount": "菜单项数量",
    "menu.buttonCount": "按钮权限",
    "menu.search": "搜索菜单名称或路径...",
    "menu.add": "新增菜单",
    "menu.name": "菜单名称",
    "menu.type": "类型",
    "menu.path": "路由路径",
    "menu.permission": "权限标识",
    "menu.sort": "排序",
    "menu.status": "状态",
    "menu.directory": "目录",
    "menu.item": "菜单",
    "menu.button": "按钮",
    "menu.edit": "编辑菜单",
    "menu.editDescription": "修改菜单信息",
    "menu.addDescription": "填写菜单信息",
    "menu.selectType": "菜单类型",
    "menu.enterName": "输入菜单名称",
    "menu.exampleAddUser": "例如：新增用户",
    "menu.menuPath": "菜单路径",
    "menu.icon": "图标",
    "menu.iconPlaceholder": "lucide-react 图标名称",
    "menu.parent": "父菜单",
    "menu.topLevel": "无（顶级菜单）",
    "menu.examplePermission": "例如: menu:read 或 user:add",
    "menu.confirmDelete": "确认删除",
    "menu.deleteConfirmation": "您确定要删除此菜单吗？此操作无法撤销。",
    "menu.noData": "暂无数据",

    // 设置
    "settings.title": "系统设置",
    "settings.language": "语言",
    "settings.theme": "主题模式",
    "settings.layout": "布局设置",
    "settings.colorScheme": "颜色方案",
    "settings.light": "浅色",
    "settings.dark": "深色",
    "settings.system": "跟随系统",
    "settings.sidebarMode": "侧边栏模式",
    "settings.fullWidth": "完整宽度",
    "settings.collapsed": "收起模式",
    "settings.primaryColor": "主题色",
    "settings.blue": "蓝色",
    "settings.purple": "紫色",
    "settings.green": "绿色",
    "settings.orange": "橙色",
  },
  en: {
    // Common
    "common.search": "Search",
    "common.add": "Add",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.save": "Save",
    "common.actions": "Actions",
    "common.status": "Status",
    "common.description": "Description",
    "common.welcome": "Welcome back",

    // Menu
    "menu.dashboard": "Dashboard",
    "menu.system": "System",
    "menu.departments": "Departments",
    "menu.users": "Users",
    "menu.roles": "Roles",
    "menu.permissions": "Permissions",
    "menu.development": "Development",
    "menu.menus": "Menus",
    "menu.settings": "Settings",

    // User
    "user.myAccount": "My Account",
    "user.logout": "Logout",
    "user.profile": "Profile",

    // Departments
    "department.title": "Department Management",
    "department.description": "Manage organization structure and departments",
    "department.list": "Department List",
    "department.search": "Search departments...",
    "department.name": "Department Name",
    "department.id": "ID",
    "department.parent": "Parent Department",
    "department.manager": "Manager",
    "department.memberCount": "Members",
    "department.createTime": "Created At",
    "department.noParent": "No Parent",
    "department.edit": "Edit Department",
    "department.add": "Add Department",
    "department.editDescription": "Modify department details",
    "department.addDescription": "Create a new department",
    "department.confirmDelete": "Confirm Delete",
    "department.deleteConfirmation":
      "Are you sure you want to delete this department? This cannot be undone.",
    "department.nameRequired": "Department name is required",
    "department.enterName": "Enter department name",
    "department.enterManager": "Enter manager name",
    "department.enterPhone": "Enter phone number",
    "department.enterEmail": "Enter email",
    "department.enterDescription": "Enter description",
    "department.phone": "Phone",
    "department.email": "Email",

    // Roles
    "role.title": "Role Management",
    "role.description": "Manage system roles and permissions",
    "role.list": "Role List",
    "role.search": "Search roles...",
    "role.name": "Role Name",
    "role.id": "ID",
    "role.desc": "Description",
    "role.permissions": "Permissions",
    "role.userCount": "Users",
    "role.createTime": "Created At",
    "role.edit": "Edit Role",
    "role.add": "Add Role",
    "role.editDescription": "Modify role and permissions",
    "role.addDescription": "Create new role and assign permissions",
    "role.confirmDelete": "Confirm Delete",
    "role.deleteConfirmation": "Are you sure you want to delete this role? This cannot be undone.",
    "role.enterName": "Enter role name",
    "role.enterDescription": "Enter description",
    "role.permissionConfig": "Permission Configuration",
    "role.noMenuData": "No menu data available",
    "role.button": "Button",
    "role.menuPermissionCount": "menus/permissions",

    // Users
    "user.title": "User Management",
    "user.description": "Manage system users",
    "user.list": "User List",
    "user.search": "Search users...",
    "user.username": "Username",
    "user.name": "Name",
    "user.contact": "Contact",
    "user.department": "Department",
    "user.role": "Role",
    "user.status": "Status",
    "user.createTime": "Created At",
    "user.edit": "Edit User",
    "user.add": "Add User",
    "user.editDescription": "Modify user details",
    "user.addDescription": "Create a new user account",
    "user.confirmDelete": "Confirm Delete",
    "user.deleteConfirmation": "Are you sure you want to delete this user? This cannot be undone.",
    "user.enterUsername": "Enter username",
    "user.enterName": "Enter name",
    "user.mobile": "Mobile",
    "user.enterMobile": "Enter mobile number",
    "user.selectDepartment": "Select Department",
    "user.selectRole": "Select Role",
    "user.password": "Password",
    "user.initialPassword": "Enter initial password",
    "user.newPassword": "Enter new password",
    "user.passwordPlaceholder": "Password (leave empty to keep unchanged)",
    "user.active": "Active",
    "user.inactive": "Inactive",

    // Menus
    "menu.title": "Menu Management",
    "menu.description": "Manage menu structure and permissions",
    "menu.total": "Total Menus",
    "menu.directoryCount": "Directories",
    "menu.menuCount": "Menu Items",
    "menu.buttonCount": "Buttons",
    "menu.search": "Search menu name or path...",
    "menu.add": "Add Menu",
    "menu.name": "Menu Name",
    "menu.type": "Type",
    "menu.path": "Route Path",
    "menu.permission": "Permission Key",
    "menu.sort": "Sort",
    "menu.status": "Status",
    "menu.directory": "Directory",
    "menu.item": "Menu",
    "menu.button": "Button",
    "menu.edit": "Edit Menu",
    "menu.editDescription": "Modify menu details",
    "menu.addDescription": "Enter menu details",
    "menu.selectType": "Menu Type",
    "menu.enterName": "Enter menu name",
    "menu.exampleAddUser": "e.g., Add User",
    "menu.menuPath": "Menu Path",
    "menu.icon": "Icon",
    "menu.iconPlaceholder": "lucide-react icon name",
    "menu.parent": "Parent Menu",
    "menu.topLevel": "None (Top Level)",
    "menu.examplePermission": "e.g. menu:read or user:add",
    "menu.confirmDelete": "Confirm Delete",
    "menu.deleteConfirmation": "Are you sure you want to delete this menu? This cannot be undone.",
    "menu.noData": "No Data",

    // Settings
    "settings.title": "System Settings",
    "settings.language": "Language",
    "settings.theme": "Theme Mode",
    "settings.layout": "Layout Settings",
    "settings.colorScheme": "Color Scheme",
    "settings.light": "Light",
    "settings.dark": "Dark",
    "settings.system": "System",
    "settings.sidebarMode": "Sidebar Mode",
    "settings.fullWidth": "Full Width",
    "settings.collapsed": "Collapsed",
    "settings.primaryColor": "Primary Color",
    "settings.blue": "Blue",
    "settings.purple": "Purple",
    "settings.green": "Green",
    "settings.orange": "Orange",
  },
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("zh")

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language
    if (saved && (saved === "zh" || saved === "en")) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.zh] || key
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}
