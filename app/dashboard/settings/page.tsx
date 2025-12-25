"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n-context"
import { useTheme } from "@/lib/theme-context"
import { Sun, Moon, Monitor, Maximize2, Minimize2, Palette } from "lucide-react"
import { useState, useEffect } from "react"

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n()
  const { themeMode, setThemeMode, sidebarMode, setSidebarMode, primaryColor, setPrimaryColor } =
    useTheme()
  const [customColor, setCustomColor] = useState("#000000")

  useEffect(() => {
    if (primaryColor.startsWith("#")) {
      setCustomColor(primaryColor)
    }
  }, [primaryColor])

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    setPrimaryColor(color)
  }

  const isPreset = ["blue", "purple", "green", "orange"].includes(primaryColor)

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
                className="flex h-auto flex-col gap-2 py-4"
              >
                <Sun className="h-5 w-5" />
                <span>{t("settings.light")}</span>
              </Button>
              <Button
                variant={themeMode === "dark" ? "default" : "outline"}
                onClick={() => setThemeMode("dark")}
                className="flex h-auto flex-col gap-2 py-4"
              >
                <Moon className="h-5 w-5" />
                <span>{t("settings.dark")}</span>
              </Button>
              <Button
                variant={themeMode === "system" ? "default" : "outline"}
                onClick={() => setThemeMode("system")}
                className="flex h-auto flex-col gap-2 py-4"
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
                className="flex h-auto flex-col gap-2 py-4"
              >
                <Maximize2 className="h-5 w-5" />
                <span>{t("settings.fullWidth")}</span>
              </Button>
              <Button
                variant={sidebarMode === "collapsed" ? "default" : "outline"}
                onClick={() => setSidebarMode("collapsed")}
                className="flex h-auto flex-col gap-2 py-4"
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
            <div className="grid grid-cols-5 gap-2">
              <Button
                variant={primaryColor === "blue" ? "default" : "outline"}
                onClick={() => setPrimaryColor("blue")}
                className="flex h-20 flex-col gap-2"
              >
                <div className="h-8 w-8 rounded-full bg-blue-500" />
                <span className="text-xs">{t("settings.blue")}</span>
              </Button>
              <Button
                variant={primaryColor === "purple" ? "default" : "outline"}
                onClick={() => setPrimaryColor("purple")}
                className="flex h-20 flex-col gap-2"
              >
                <div className="h-8 w-8 rounded-full bg-purple-500" />
                <span className="text-xs">{t("settings.purple")}</span>
              </Button>
              <Button
                variant={primaryColor === "green" ? "default" : "outline"}
                onClick={() => setPrimaryColor("green")}
                className="flex h-20 flex-col gap-2"
              >
                <div className="h-8 w-8 rounded-full bg-green-500" />
                <span className="text-xs">{t("settings.green")}</span>
              </Button>
              <Button
                variant={primaryColor === "orange" ? "default" : "outline"}
                onClick={() => setPrimaryColor("orange")}
                className="flex h-20 flex-col gap-2"
              >
                <div className="h-8 w-8 rounded-full bg-orange-500" />
                <span className="text-xs">{t("settings.orange")}</span>
              </Button>

              <div
                className={`text-card-foreground hover:bg-accent hover:text-accent-foreground flex h-20 flex-col items-center justify-center gap-2 rounded-md border px-4 py-2 shadow-sm ${!isPreset ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "bg-background"}`}
              >
                <div className="relative h-8 w-8 overflow-hidden rounded-full border shadow-sm">
                  <input
                    type="color"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] cursor-pointer border-0 p-0"
                  />
                </div>
                <span className="text-xs">自定义</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
