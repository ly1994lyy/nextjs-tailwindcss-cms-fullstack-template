import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const type = searchParams.get("type")

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ]
    }

    if (type) {
      where.type = type
    }

    const permissions = await prisma.permission.findMany({
      where,
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    })

    const formattedPermissions = permissions.map((p) => ({
      ...p,
      roleCount: p.rolePermissions.length,
      roles: p.rolePermissions.map((rp) => rp.role),
    }))

    return NextResponse.json(formattedPermissions)
  } catch (error) {
    console.error("[v0] Get permissions error:", error)
    return NextResponse.json({ error: "获取权限列表失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, type, sortOrder, status, description } = body

    if (!name || !code || !type) {
      return NextResponse.json({ error: "权限名称、编码和类型不能为空" }, { status: 400 })
    }

    // Check existing
    const existing = await prisma.permission.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json({ error: "权限编码已存在" }, { status: 400 })
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        code,
        type,
        sortOrder: sortOrder || 0,
        status: status || "active",
        description,
      },
    })

    return NextResponse.json(permission, { status: 201 })
  } catch (error) {
    console.error("[v0] Create permission error:", error)
    return NextResponse.json({ error: "创建权限失败" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, code, type, sortOrder, status, description } = body

    if (!id || !name || !code || !type) {
      return NextResponse.json({ error: "ID、权限名称、编码和类型不能为空" }, { status: 400 })
    }

    const permission = await prisma.permission.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        type,
        sortOrder: sortOrder || 0,
        status,
        description,
      },
    })

    return NextResponse.json(permission)
  } catch (error: any) {
    console.error("[v0] Update permission error:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "权限编码已存在" }, { status: 400 })
    }
    return NextResponse.json({ error: "更新权限失败" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID不能为空" }, { status: 400 })
    }

    // Check usage
    const roleCount = await prisma.rolePermission.count({
      where: { permissionId: parseInt(id) },
    })

    if (roleCount > 0) {
      return NextResponse.json({ error: "该权限已被角色使用，无法删除" }, { status: 400 })
    }

    await prisma.permission.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: "删除成功" })
  } catch (error) {
    console.error("[v0] Delete permission error:", error)
    return NextResponse.json({ error: "删除权限失败" }, { status: 500 })
  }
}
