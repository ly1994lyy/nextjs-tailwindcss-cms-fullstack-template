"use client"

import React from "react"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  Lock,
  MenuIcon,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  Settings,
  Code,
  ChevronLeft,
  Home,
  Sun,
  Moon,
  Monitor,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n-context"
import { useTheme } from "@/lib/theme-context"
import { useTabs } from "@/lib/tabs-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const menuItems = [
  {
    title: "menu.dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    permission: null,
  },
  {
    title: "menu.system",
    icon: Settings,
    permission: null,
    children: [
      {
        title: "menu.departments",
        icon: Building2,
        href: "/dashboard/departments",
        permission: "department:read",
      },
      {
        title: "menu.users",
        icon: Users,
        href: "/dashboard/users",
        permission: "user:read",
      },
      {
        title: "menu.roles",
        icon: Shield,
        href: "/dashboard/roles",
        permission: "role:read",
      },
      {
        title: "menu.permissions",
        icon: Lock,
        href: "/dashboard/permissions",
        permission: "permission:read",
      },
    ],
  },
  {
    title: "menu.development",
    icon: Code,
    permission: null,
    children: [
      {
        title: "menu.menus",
        icon: MenuIcon,
        href: "/dashboard/menus",
        permission: "menu:read",
      },
    ],
  },
]

function MenuItem({ item, pathname, onNavigate, hasPermission, collapsed, t }: any) {
  const [expanded, setExpanded] = useState(true)
  const Icon = item.icon

  if (item.children) {
    const filteredChildren = item.children.filter(
      (child: any) => !child.permission || hasPermission(child.permission) || hasPermission("*"),
    )

    if (filteredChildren.length === 0) return null

    return (
      <li>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          title={collapsed ? t(item.title) : ""}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{t(item.title)}</span>
              <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
            </>
          )}
        </button>
        {expanded && !collapsed && (
          <ul className="ml-4 mt-1 space-y-1">
            {filteredChildren.map((child: any) => (
              <MenuItem
                key={child.href}
                item={child}
                pathname={pathname}
                onNavigate={onNavigate}
                hasPermission={hasPermission}
                collapsed={false}
                t={t}
              />
            ))}
          </ul>
        )}
      </li>
    )
  }

  const isActive = pathname === item.href
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
        onClick={onNavigate}
        title={collapsed ? t(item.title) : ""}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{t(item.title)}</span>}
      </Link>
    </li>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, hasPermission } = useAuth()
  const { t, language, setLanguage } = useI18n()
  const { sidebarMode, setSidebarMode, themeMode, setThemeMode, isDark } = useTheme()
  const { tabs, activeTab, addTab, removeTab, setActiveTab } = useTabs()

  useEffect(() => {
    const getTabTitle = (path: string) => {
      if (path === "/dashboard") return t("menu.dashboard")
      if (path === "/dashboard/departments") return t("menu.departments")
      if (path === "/dashboard/users") return t("menu.users")
      if (path === "/dashboard/roles") return t("menu.roles")
      if (path === "/dashboard/permissions") return t("menu.permissions")
      if (path === "/dashboard/menus") return t("menu.menus")
      if (path === "/dashboard/settings") return t("menu.settings")
      return path.split("/").pop() || ""
    }

    addTab({ key: pathname, title: getTabTitle(pathname), path: pathname })
  }, [pathname])

  const breadcrumbs = pathname.split("/").filter(Boolean)

  const collapsed = sidebarMode === "collapsed"

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.children) {
      return item.children.some(
        (child: any) => !child.permission || hasPermission(child.permission) || hasPermission("*"),
      )
    }
    return !item.permission || hasPermission(item.permission) || hasPermission("*")
  })

  return (
    <AuthGuard>
      <div className="flex h-screen bg-muted/40">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 bg-card border-r border-border transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            collapsed ? "lg:w-16" : "lg:w-64",
            !collapsed && "w-64",
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              {!collapsed && <h1 className="text-xl font-bold">Admin</h1>}
              {collapsed && <LayoutDashboard className="h-6 w-6" />}
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <ul className="space-y-1">
                {filteredMenuItems.map((item) => (
                  <MenuItem
                    key={item.title}
                    item={item}
                    pathname={pathname}
                    onNavigate={() => setMobileOpen(false)}
                    hasPermission={hasPermission}
                    collapsed={collapsed}
                    t={t}
                  />
                ))}
              </ul>
            </nav>

            <div className="p-4 border-t border-border space-y-2">
              {/* 收起/展开按钮 */}
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "sm"}
                className="w-full hidden lg:flex"
                onClick={() => setSidebarMode(collapsed ? "full" : "collapsed")}
              >
                <ChevronLeft className={cn("h-4 w-4", collapsed && "rotate-180")} />
                {!collapsed && <span className="ml-2">{collapsed ? "展开" : "收起"}</span>}
              </Button>

              {/* 用户信息 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={cn("w-full", collapsed ? "px-2" : "justify-start gap-2")}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold shrink-0">
                        {user?.name.charAt(0)}
                      </div>
                      {!collapsed && (
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-sm font-medium truncate">{user?.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user?.role}</div>
                        </div>
                      )}
                    </div>
                    {!collapsed && <ChevronDown className="h-4 w-4 shrink-0" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t("user.myAccount")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* 语言切换 */}
                  <DropdownMenuItem onClick={() => setLanguage(language === "zh" ? "en" : "zh")}>
                    <Globe className="mr-2 h-4 w-4" />
                    <span>{language === "zh" ? "English" : "中文"}</span>
                  </DropdownMenuItem>

                  {/* 主题切换 */}
                  <DropdownMenuItem
                    onClick={() => {
                      if (themeMode === "light") setThemeMode("dark")
                      else if (themeMode === "dark") setThemeMode("system")
                      else setThemeMode("light")
                    }}
                  >
                    {themeMode === "light" && <Sun className="mr-2 h-4 w-4" />}
                    {themeMode === "dark" && <Moon className="mr-2 h-4 w-4" />}
                    {themeMode === "system" && <Monitor className="mr-2 h-4 w-4" />}
                    <span>
                      {themeMode === "light" && t("settings.light")}
                      {themeMode === "dark" && t("settings.dark")}
                      {themeMode === "system" && t("settings.system")}
                    </span>
                  </DropdownMenuItem>

                  {/* 设置 */}
                  <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t("menu.settings")}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("user.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                <MenuIcon className="h-5 w-5" />
              </Button>

              {/* 面包屑 */}
              <nav className="hidden md:flex items-center gap-2 text-sm">
                <Home className="h-4 w-4 text-muted-foreground" />
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className={index === breadcrumbs.length - 1 ? "font-medium" : "text-muted-foreground"}>
                      {crumb}
                    </span>
                  </React.Fragment>
                ))}
              </nav>
            </div>
            <div className="text-sm text-muted-foreground">
              {t("common.welcome")}, {user?.name}
            </div>
          </header>

          <div className="border-b border-border bg-card px-4 flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <div
                key={tab.key}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors cursor-pointer group",
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
                onClick={() => {
                  setActiveTab(tab.key)
                  router.push(tab.path)
                }}
              >
                <span className="text-sm whitespace-nowrap">{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeTab(tab.key)
                      if (activeTab === tab.key && tabs.length > 1) {
                        const remainingTabs = tabs.filter((t) => t.key !== tab.key)
                        const nextTab = remainingTabs[remainingTabs.length - 1]
                        router.push(nextTab.path)
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
