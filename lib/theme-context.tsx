"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type ThemeMode = "light" | "dark" | "system"
type SidebarMode = "full" | "collapsed"
type PrimaryColor = "blue" | "purple" | "green" | "orange"

interface ThemeContextType {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  sidebarMode: SidebarMode
  setSidebarMode: (mode: SidebarMode) => void
  primaryColor: PrimaryColor
  setPrimaryColor: (color: PrimaryColor) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const colorSchemes = {
  blue: {
    light: {
      primary: "oklch(0.492 0.191 255.515)",
      primaryForeground: "oklch(0.985 0 0)",
    },
    dark: {
      primary: "oklch(0.6 0.216 255.515)",
      primaryForeground: "oklch(0.145 0 0)",
    },
  },
  purple: {
    light: {
      primary: "oklch(0.488 0.243 304.376)",
      primaryForeground: "oklch(0.985 0 0)",
    },
    dark: {
      primary: "oklch(0.627 0.265 303.9)",
      primaryForeground: "oklch(0.145 0 0)",
    },
  },
  green: {
    light: {
      primary: "oklch(0.55 0.18 150)",
      primaryForeground: "oklch(0.985 0 0)",
    },
    dark: {
      primary: "oklch(0.696 0.17 162.48)",
      primaryForeground: "oklch(0.145 0 0)",
    },
  },
  orange: {
    light: {
      primary: "oklch(0.646 0.222 41.116)",
      primaryForeground: "oklch(0.985 0 0)",
    },
    dark: {
      primary: "oklch(0.769 0.188 70.08)",
      primaryForeground: "oklch(0.145 0 0)",
    },
  },
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system")
  const [sidebarMode, setSidebarModeState] = useState<SidebarMode>("full")
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColor>("blue")
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("themeMode") as ThemeMode
    const savedSidebar = localStorage.getItem("sidebarMode") as SidebarMode
    const savedColor = localStorage.getItem("primaryColor") as PrimaryColor

    if (savedTheme) setThemeModeState(savedTheme)
    if (savedSidebar) setSidebarModeState(savedSidebar)
    if (savedColor) setPrimaryColorState(savedColor)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    let effectiveTheme = themeMode

    if (themeMode === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }

    const isDarkMode = effectiveTheme === "dark"
    setIsDark(isDarkMode)

    root.style.setProperty("transition", "background-color 0.3s ease, color 0.3s ease")

    if (isDarkMode) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }

    const colors = colorSchemes[primaryColor][isDarkMode ? "dark" : "light"]
    root.style.setProperty("--primary", colors.primary)
    root.style.setProperty("--primary-foreground", colors.primaryForeground)

    setTimeout(() => {
      root.style.removeProperty("transition")
    }, 300)
  }, [themeMode, primaryColor])

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
    localStorage.setItem("themeMode", mode)
  }

  const setSidebarMode = (mode: SidebarMode) => {
    setSidebarModeState(mode)
    localStorage.setItem("sidebarMode", mode)
  }

  const setPrimaryColor = (color: PrimaryColor) => {
    setPrimaryColorState(color)
    localStorage.setItem("primaryColor", color)
  }

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        sidebarMode,
        setSidebarMode,
        primaryColor,
        setPrimaryColor,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
