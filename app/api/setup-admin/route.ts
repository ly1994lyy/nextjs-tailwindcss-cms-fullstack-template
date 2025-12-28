import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hashPassword } from "@/lib/password"

export async function GET() {
  try {
    // 1. Ensure Admin Role
    let adminRole = await prisma.role.findUnique({
      where: { code: "admin" },
    })

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: "系统管理员",
          code: "admin",
          description: "系统最高权限管理员",
          status: "active",
        },
      })
    }

    // 2. Ensure Admin User
    const username = "admin"
    let adminUser = await prisma.user.findUnique({
      where: { username },
    })

    if (!adminUser) {
      const hashedPassword = await hashPassword("admin123")
      adminUser = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          realName: "系统管理员",
          status: "active",
          userRoles: {
            create: {
              roleId: adminRole.id,
            },
          },
        },
      })
    } else {
      // Ensure password is correct/reset
      const hashedPassword = await hashPassword("admin123")
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { password: hashedPassword },
      })

      // Ensure Role Link
      const userRole = await prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: adminRole.id,
          },
        },
      })

      if (!userRole) {
        await prisma.userRole.create({
          data: {
            userId: adminUser.id,
            roleId: adminRole.id,
          },
        })
      }
    }

    return NextResponse.json({ success: true, message: "Admin user setup complete." })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
