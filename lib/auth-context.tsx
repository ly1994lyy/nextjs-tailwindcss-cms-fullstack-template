"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  username: string
  realName: string
  email: string | null
  phone: string | null
  departmentId: number | null
  departmentName?: string
  roles: string[]
  permissions: string[]
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Restore user session from localStorage
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        // Validate user structure (ensure roles is an array to avoid crashes on old data)
        if (parsedUser && Array.isArray(parsedUser.roles)) {
          setUser(parsedUser)
        } else {
          localStorage.removeItem("user")
        }
      } catch (e) {
        console.error("Failed to parse user from local storage", e)
        localStorage.removeItem("user")
      }
    }
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        const data = await res.json()

        const userObj: User = {
          ...data.user,
          roles: data.roles.map((r: any) => r.code),
          permissions: data.permissions,
        }

        setUser(userObj)
        localStorage.setItem("user", JSON.stringify(userObj))
        return true
      }

      return false
    } catch (error) {
      console.error("Login failed", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")
  }

  const hasPermission = (permission: string) => {
    if (!user) return false
    // Admin has all permissions
    if (user.roles.includes("admin") || user.permissions.includes("*")) return true

    // Check specific permission
    return user.permissions.includes(permission)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
