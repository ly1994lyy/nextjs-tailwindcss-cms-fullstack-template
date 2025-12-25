"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type ThemeMode = "light" | "dark" | "system"
type SidebarMode = "full" | "collapsed"

interface ThemeContextType {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  sidebarMode: SidebarMode
  setSidebarMode: (mode: SidebarMode) => void
  primaryColor: string
  setPrimaryColor: (color: string) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const colorSchemes: Record<
  string,
  {
    light: { primary: string; primaryForeground: string }
    dark: { primary: string; primaryForeground: string }
  }
> = {
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

// Simple hex to contrast color helper
function getContrastColor(hex: string) {
  // Convert hex to RGB
  const r = parseInt(hex.substr(1, 2), 16)
  const g = parseInt(hex.substr(3, 2), 16)
  const b = parseInt(hex.substr(5, 2), 16)

  // Calculate luminance
  const yiq = (r * 299 + g * 587 + b * 114) / 1000

  // Return black or white depending on luminance
  return yiq >= 128 ? "oklch(0.145 0 0)" : "oklch(0.985 0 0)"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system")
  const [sidebarMode, setSidebarModeState] = useState<SidebarMode>("full")
  const [primaryColor, setPrimaryColorState] = useState<string>("blue")
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("themeMode") as ThemeMode
    const savedSidebar = localStorage.getItem("sidebarMode") as SidebarMode
    const savedColor = localStorage.getItem("primaryColor")

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

    // Handle Color Application
    if (colorSchemes[primaryColor]) {
      // Preset color
      const colors = colorSchemes[primaryColor][isDarkMode ? "dark" : "light"]
      root.style.setProperty("--primary", colors.primary)
      root.style.setProperty("--primary-foreground", colors.primaryForeground)
    } else if (primaryColor.startsWith("#")) {
      // Custom Hex color
      // Check if valid hex
      if (/^#[0-9A-F]{6}$/i.test(primaryColor)) {
        root.style.setProperty("--primary", primaryColor)
        root.style.setProperty("--primary-foreground", getContrastColor(primaryColor))
      }
    }

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

  const setPrimaryColor = (color: string) => {
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
