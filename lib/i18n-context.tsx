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

  return <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}
