"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n-context"
import { useTheme } from "@/lib/theme-context"
import { Sun, Moon, Monitor, Maximize2, Minimize2 } from "lucide-react"

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n()
  const { themeMode, setThemeMode, sidebarMode, setSidebarMode, primaryColor, setPrimaryColor } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 语言设置 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.language")}</CardTitle>
            <CardDescription>选择系统界面语言 / Select interface language</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={language === "zh" ? "default" : "outline"}
                onClick={() => setLanguage("zh")}
                className="flex-1"
              >
                中文
              </Button>
              <Button
                variant={language === "en" ? "default" : "outline"}
                onClick={() => setLanguage("en")}
                className="flex-1"
              >
                English
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 主题模式 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.theme")}</CardTitle>
            <CardDescription>{t("settings.colorScheme")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={themeMode === "light" ? "default" : "outline"}
                onClick={() => setThemeMode("light")}
                className="flex flex-col gap-2 h-auto py-4"
              >
                <Sun className="h-5 w-5" />
                <span>{t("settings.light")}</span>
              </Button>
              <Button
                variant={themeMode === "dark" ? "default" : "outline"}
                onClick={() => setThemeMode("dark")}
                className="flex flex-col gap-2 h-auto py-4"
              >
                <Moon className="h-5 w-5" />
                <span>{t("settings.dark")}</span>
              </Button>
              <Button
                variant={themeMode === "system" ? "default" : "outline"}
                onClick={() => setThemeMode("system")}
                className="flex flex-col gap-2 h-auto py-4"
              >
                <Monitor className="h-5 w-5" />
                <span>{t("settings.system")}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 侧边栏模式 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.sidebarMode")}</CardTitle>
            <CardDescription>{t("settings.layout")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={sidebarMode === "full" ? "default" : "outline"}
                onClick={() => setSidebarMode("full")}
                className="flex flex-col gap-2 h-auto py-4"
              >
                <Maximize2 className="h-5 w-5" />
                <span>{t("settings.fullWidth")}</span>
              </Button>
              <Button
                variant={sidebarMode === "collapsed" ? "default" : "outline"}
                onClick={() => setSidebarMode("collapsed")}
                className="flex flex-col gap-2 h-auto py-4"
              >
                <Minimize2 className="h-5 w-5" />
                <span>{t("settings.collapsed")}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 主题色 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.primaryColor")}</CardTitle>
            <CardDescription>选择系统主题颜色</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant={primaryColor === "blue" ? "default" : "outline"}
                onClick={() => setPrimaryColor("blue")}
                className="h-20 flex flex-col gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500" />
                <span>{t("settings.blue")}</span>
              </Button>
              <Button
                variant={primaryColor === "purple" ? "default" : "outline"}
                onClick={() => setPrimaryColor("purple")}
                className="h-20 flex flex-col gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-purple-500" />
                <span>{t("settings.purple")}</span>
              </Button>
              <Button
                variant={primaryColor === "green" ? "default" : "outline"}
                onClick={() => setPrimaryColor("green")}
                className="h-20 flex flex-col gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-green-500" />
                <span>{t("settings.green")}</span>
              </Button>
              <Button
                variant={primaryColor === "orange" ? "default" : "outline"}
                onClick={() => setPrimaryColor("orange")}
                className="h-20 flex flex-col gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-orange-500" />
                <span>{t("settings.orange")}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
