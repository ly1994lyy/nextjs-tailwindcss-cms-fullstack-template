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

    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const skip = (page - 1) * pageSize

    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
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
        skip,
        take: pageSize,
      }),
      prisma.permission.count({ where }),
    ])

    const formattedPermissions = permissions.map((p) => ({
      ...p,
      roleCount: p.rolePermissions.length,
      roles: p.rolePermissions.map((rp) => rp.role),
    }))

    return NextResponse.json({
      data: formattedPermissions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("[v0] Get permissions error:", error)
    return NextResponse.json({ error: "获取权限列表失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, type, sortOrder, status, description, menuId } = body

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

    // Handle Menu Association
    if (menuId) {
      // Clear any existing menu using this code (safety)
      await prisma.menu.updateMany({
        where: { permissionCode: code },
        data: { permissionCode: null },
      })

      // Assign to new menu
      await prisma.menu.update({
        where: { id: parseInt(menuId) },
        data: { permissionCode: code },
      })
    }

    return NextResponse.json(permission, { status: 201 })
  } catch (error) {
    console.error("[v0] Create permission error:", error)
    return NextResponse.json({ error: "创建权限失败" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, code, type, sortOrder, status, description, menuId } = body

    if (!id || !name || !code || !type) {
      return NextResponse.json({ error: "ID、权限名称、编码和类型不能为空" }, { status: 400 })
    }

    // Get old permission to check for code change
    const oldPermission = await prisma.permission.findUnique({
      where: { id: parseInt(id) },
    })

    if (!oldPermission) {
      return NextResponse.json({ error: "权限不存在" }, { status: 404 })
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

    // Handle Menu Association

    // 1. If code changed, clear old references
    if (oldPermission.code !== code) {
      await prisma.menu.updateMany({
        where: { permissionCode: oldPermission.code },
        data: { permissionCode: null },
      })
    }

    // 2. If menuId provided, set new association
    if (menuId) {
      // Ensure specific target menu has the code
      // First clear any other menus using this new code
      await prisma.menu.updateMany({
        where: { permissionCode: code },
        data: { permissionCode: null },
      })

      // Then set
      await prisma.menu.update({
        where: { id: parseInt(menuId) },
        data: { permissionCode: code },
      })
    } else {
      // If menuId is empty/null, it means we want to clear any association with this permission
      await prisma.menu.updateMany({
        where: { permissionCode: code },
        data: { permissionCode: null },
      })
    }

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
