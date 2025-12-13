export type Locale = "zh" | "en"

export const translations = {
  zh: {
    // 通用
    welcome: "欢迎回来",
    logout: "退出登录",
    myAccount: "我的账户",
    search: "搜索",
    add: "添加",
    edit: "编辑",
    delete: "删除",
    save: "保存",
    cancel: "取消",
    confirm: "确认",
    status: "状态",
    active: "启用",
    inactive: "禁用",
    actions: "操作",
    createTime: "创建时间",

    // 菜单
    dashboard: "仪表板",
    systemManage: "系统管理",
    devManage: "开发管理",
    departments: "部门管理",
    users: "用户管理",
    roles: "角色管理",
    permissions: "权限管理",
    menus: "菜单管理",

    // 部门管理
    departmentList: "部门列表",
    departmentName: "部门名称",
    parentDepartment: "上级部门",
    addDepartment: "添加部门",
    editDepartment: "编辑部门",

    // 用户管理
    userList: "用户列表",
    username: "用户名",
    name: "姓名",
    email: "邮箱",
    phone: "电话",
    department: "部门",
    role: "角色",
    addUser: "添加用户",
    editUser: "编辑用户",

    // 角色管理
    roleList: "角色列表",
    roleName: "角色名称",
    roleCode: "角色代码",
    description: "描述",
    assignPermissions: "分配权限",
    addRole: "添加角色",
    editRole: "编辑角色",

    // 权限管理
    permissionList: "权限列表",
    permissionName: "权限名称",
    permissionCode: "权限代码",
    category: "分类",
    addPermission: "添加权限",
    editPermission: "编辑权限",

    // 菜单管理
    menuList: "菜单列表",
    menuName: "菜单名称",
    menuType: "菜单类型",
    directory: "目录",
    menu: "菜单",
    icon: "图标",
    path: "路径",
    sortOrder: "排序",
    addMenu: "添加菜单",
    editMenu: "编辑菜单",

    // 设置
    settings: "设置",
    theme: "主题",
    light: "浅色",
    dark: "深色",
    language: "语言",
    layout: "布局",
    layoutSettings: "布局设置",
    colorSettings: "颜色设置",
    sidebarCollapsed: "收起侧边栏",
    primaryColor: "主色调",
  },
  en: {
    // Common
    welcome: "Welcome back",
    logout: "Logout",
    myAccount: "My Account",
    search: "Search",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    actions: "Actions",
    createTime: "Create Time",

    // Menu
    dashboard: "Dashboard",
    systemManage: "System",
    devManage: "Development",
    departments: "Departments",
    users: "Users",
    roles: "Roles",
    permissions: "Permissions",
    menus: "Menus",

    // Departments
    departmentList: "Department List",
    departmentName: "Department Name",
    parentDepartment: "Parent Department",
    addDepartment: "Add Department",
    editDepartment: "Edit Department",

    // Users
    userList: "User List",
    username: "Username",
    name: "Name",
    email: "Email",
    phone: "Phone",
    department: "Department",
    role: "Role",
    addUser: "Add User",
    editUser: "Edit User",

    // Roles
    roleList: "Role List",
    roleName: "Role Name",
    roleCode: "Role Code",
    description: "Description",
    assignPermissions: "Assign Permissions",
    addRole: "Add Role",
    editRole: "Edit Role",

    // Permissions
    permissionList: "Permission List",
    permissionName: "Permission Name",
    permissionCode: "Permission Code",
    category: "Category",
    addPermission: "Add Permission",
    editPermission: "Edit Permission",

    // Menus
    menuList: "Menu List",
    menuName: "Menu Name",
    menuType: "Menu Type",
    directory: "Directory",
    menu: "Menu",
    icon: "Icon",
    path: "Path",
    sortOrder: "Sort Order",
    addMenu: "Add Menu",
    editMenu: "Edit Menu",

    // Settings
    settings: "Settings",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    language: "Language",
    layout: "Layout",
    layoutSettings: "Layout Settings",
    colorSettings: "Color Settings",
    sidebarCollapsed: "Collapse Sidebar",
    primaryColor: "Primary Color",
  },
}

export function useTranslation(locale: Locale) {
  return (key: keyof typeof translations.zh) => {
    return translations[locale][key] || key
  }
}
