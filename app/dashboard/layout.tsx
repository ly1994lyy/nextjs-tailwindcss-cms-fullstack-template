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
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors"
          title={collapsed ? t(item.title) : ""}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{t(item.title)}</span>
              <ChevronRight
                className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")}
              />
            </>
          )}
        </button>
        {expanded && !collapsed && (
          <ul className="mt-1 ml-4 space-y-1">
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
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
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
    const getTabInfo = (path: string) => {
      if (path === "/dashboard")
        return { title: t("menu.dashboard"), translationKey: "menu.dashboard" }
      if (path === "/dashboard/departments")
        return { title: t("menu.departments"), translationKey: "menu.departments" }
      if (path === "/dashboard/users")
        return { title: t("menu.users"), translationKey: "menu.users" }
      if (path === "/dashboard/roles")
        return { title: t("menu.roles"), translationKey: "menu.roles" }
      if (path === "/dashboard/permissions")
        return { title: t("menu.permissions"), translationKey: "menu.permissions" }
      if (path === "/dashboard/menus")
        return { title: t("menu.menus"), translationKey: "menu.menus" }
      if (path === "/dashboard/settings")
        return { title: t("menu.settings"), translationKey: "menu.settings" }
      return { title: path.split("/").pop() || "", translationKey: undefined }
    }

    const { title, translationKey } = getTabInfo(pathname)
    addTab({ key: pathname, title, path: pathname, translationKey })
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
      <div className="bg-muted/40 flex h-screen">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="bg-background/80 fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={cn(
            "bg-card border-border fixed inset-y-0 left-0 z-50 transform border-r transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            collapsed ? "lg:w-16" : "lg:w-64",
            !collapsed && "w-64",
          )}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="border-border flex h-16 items-center justify-between border-b px-4">
              {!collapsed && <h1 className="text-xl font-bold">Admin</h1>}
              {collapsed && <LayoutDashboard className="h-6 w-6" />}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
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

            <div className="border-border space-y-2 border-t p-4">
              {/* 收起/展开按钮 */}
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "sm"}
                className="hidden w-full lg:flex"
                onClick={() => setSidebarMode(collapsed ? "full" : "collapsed")}
              >
                <ChevronLeft className={cn("h-4 w-4", collapsed && "rotate-180")} />
                {!collapsed && <span className="ml-2">{collapsed ? "展开" : "收起"}</span>}
              </Button>

              {/* 用户信息 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn("w-full", collapsed ? "px-2" : "justify-start gap-2")}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold">
                        {user?.realName?.charAt(0)}
                      </div>
                      {!collapsed && (
                        <div className="min-w-0 flex-1 text-left">
                          <div className="truncate text-sm font-medium">{user?.realName}</div>
                          <div className="text-muted-foreground truncate text-xs">
                            {user?.roles?.join(", ")}
                          </div>
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
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="border-border bg-card flex h-16 items-center justify-between border-b px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </Button>

              {/* 面包屑 */}
              <nav className="hidden items-center gap-2 text-sm md:flex">
                <Home className="text-muted-foreground h-4 w-4" />
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                    <span
                      className={
                        index === breadcrumbs.length - 1 ? "font-medium" : "text-muted-foreground"
                      }
                    >
                      {crumb}
                    </span>
                  </React.Fragment>
                ))}
              </nav>
            </div>

            <div className="text-muted-foreground text-sm">
              {t("common.welcome")}, {user?.realName}
            </div>
          </header>

          <div className="border-border bg-card flex items-center gap-1 overflow-x-auto border-b px-4">
            {tabs.map((tab) => (
              <div
                key={tab.key}
                className={cn(
                  "group flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2 transition-colors",
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent",
                )}
                onClick={() => {
                  setActiveTab(tab.key)
                  router.push(tab.path)
                }}
              >
                <span className="text-sm whitespace-nowrap">
                  {tab.translationKey ? t(tab.translationKey) : tab.title}
                </span>
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
                    className="opacity-0 transition-opacity group-hover:opacity-100"
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
