import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ]
    }

    const roles = await prisma.role.findMany({
      where,
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { userRoles: true },
        },
      },
      orderBy: {
        sortOrder: "desc",
      },
    })

    const formattedRoles = roles.map((role) => ({
      ...role,
      userCount: role._count.userRoles,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        code: rp.permission.code,
        type: rp.permission.type,
      })),
    }))

    return NextResponse.json(formattedRoles)
  } catch (error) {
    console.error("[v0] Get roles error:", error)
    return NextResponse.json({ error: "获取角色列表失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, sortOrder, status, description, permissionIds } = body

    if (!name || !code) {
      return NextResponse.json({ error: "角色名称和编码不能为空" }, { status: 400 })
    }

    // Check if code exists
    const existingRole = await prisma.role.findUnique({
      where: { code },
    })

    if (existingRole) {
      return NextResponse.json({ error: "角色编码已存在" }, { status: 400 })
    }

    const role = await prisma.role.create({
      data: {
        name,
        code,
        sortOrder: sortOrder || 0,
        status: status || "active",
        description,
        rolePermissions: {
          create: permissionIds?.map((permissionId: number) => ({
            permission: { connect: { id: permissionId } },
          })),
        },
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { userRoles: true },
        },
      },
    })

    const formattedRole = {
      ...role,
      userCount: role._count.userRoles,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        code: rp.permission.code,
        type: rp.permission.type,
      })),
    }

    return NextResponse.json(formattedRole, { status: 201 })
  } catch (error) {
    console.error("[v0] Create role error:", error)
    return NextResponse.json({ error: "创建角色失败" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, code, sortOrder, status, description, permissionIds } = body

    if (!id || !name || !code) {
      return NextResponse.json({ error: "ID、角色名称和编码不能为空" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const role = await tx.role.update({
        where: { id: parseInt(id) },
        data: {
          name,
          code,
          sortOrder: sortOrder || 0,
          status,
          description,
        },
      })

      if (permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({
          where: { roleId: role.id },
        })

        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((pid: number) => ({
              roleId: role.id,
              permissionId: pid,
            })),
          })
        }
      }

      return tx.role.findUnique({
        where: { id: role.id },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: { userRoles: true },
          },
        },
      })
    })

    const formattedRole = {
      ...result!,
      userCount: result!._count.userRoles,
      permissions: result!.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        code: rp.permission.code,
        type: rp.permission.type,
      })),
    }

    return NextResponse.json(formattedRole)
  } catch (error: any) {
    console.error("[v0] Update role error:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "角色编码已存在" }, { status: 400 })
    }
    return NextResponse.json({ error: "更新角色失败" }, { status: 500 })
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
    const userCount = await prisma.userRole.count({
      where: { roleId: parseInt(id) },
    })

    if (userCount > 0) {
      return NextResponse.json({ error: "该角色下有用户，无法删除" }, { status: 400 })
    }

    await prisma.role.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: "删除成功" })
  } catch (error) {
    console.error("[v0] Delete role error:", error)
    return NextResponse.json({ error: "删除角色失败" }, { status: 500 })
  }
}
