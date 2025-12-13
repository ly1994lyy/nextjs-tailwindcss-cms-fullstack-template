"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface Tab {
  key: string
  title: string
  path: string
}

interface TabsContextType {
  tabs: Tab[]
  activeTab: string
  addTab: (tab: Tab) => void
  removeTab: (key: string) => void
  setActiveTab: (key: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

export function TabsProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([{ key: "/dashboard", title: "仪表板", path: "/dashboard" }])
  const [activeTab, setActiveTab] = useState("/dashboard")

  const addTab = (tab: Tab) => {
    setTabs((prev) => {
      const exists = prev.find((t) => t.key === tab.key)
      if (exists) {
        return prev
      }
      return [...prev, tab]
    })
    setActiveTab(tab.key)
  }

  const removeTab = (key: string) => {
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.key !== key)
      if (activeTab === key && newTabs.length > 0) {
        setActiveTab(newTabs[newTabs.length - 1].key)
      }
      return newTabs
    })
  }

  return (
    <TabsContext.Provider value={{ tabs, activeTab, addTab, removeTab, setActiveTab }}>{children}</TabsContext.Provider>
  )
}

export function useTabs() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error("useTabs must be used within TabsProvider")
  }
  return context
}
