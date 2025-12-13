"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface AuthGuardProps {
  children: React.ReactNode
  requiredPermission?: string
}

export function AuthGuard({ children, requiredPermission }: AuthGuardProps) {
  const { user, hasPermission } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push("/dashboard")
    }
  }, [user, requiredPermission, hasPermission, router])

  if (!user) {
    return null
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">权限不足</h2>
          <p className="text-muted-foreground">您没有访问此页面的权限</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
