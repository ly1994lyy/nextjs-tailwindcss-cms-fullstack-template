import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyPassword } from "@/lib/password"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        department: true,
        userRoles: {
          include: {
            role: {
              include: {
                roleMenus: {
                  include: {
                    menu: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 })
    }

    if (user.status !== "active") {
      return NextResponse.json({ error: "用户已被禁用" }, { status: 403 })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 })
    }

    // Extract roles
    const roles = user.userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      code: ur.role.code,
    }))

    // Extract permissions from menus
    const permissions = new Set<string>()
    user.userRoles.forEach((ur) => {
      ur.role.roleMenus.forEach((rm) => {
        if (rm.menu.permissionCode && rm.menu.status === "active") {
          permissions.add(rm.menu.permissionCode)
        }
      })
    })

    const response = {
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        departmentId: user.departmentId,
        departmentName: user.department?.name,
      },
      roles,
      permissions: Array.from(permissions),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "登录失败，请稍后重试" }, { status: 500 })
  }
}
