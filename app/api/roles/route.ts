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

    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const skip = (page - 1) * pageSize

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        include: {
          roleMenus: {
            select: {
              menuId: true,
            },
          },
          _count: {
            select: { userRoles: true },
          },
        },
        orderBy: {
          sortOrder: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.role.count({ where }),
    ])

    const formattedRoles = roles.map((role) => ({
      ...role,
      userCount: role._count.userRoles,
      menuIds: role.roleMenus.map((rm) => rm.menuId),
    }))

    return NextResponse.json({
      data: formattedRoles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("[v0] Get roles error:", error)
    return NextResponse.json({ error: "获取角色列表失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, sortOrder, status, description, menuIds } = body

    if (!name) {
      return NextResponse.json({ error: "角色名称不能为空" }, { status: 400 })
    }

    let finalCode = code
    if (!finalCode) {
      finalCode = `ROLE_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    }

    // Check if code exists (only if custom code provided, or safe check for generated)
    const existingRole = await prisma.role.findUnique({
      where: { code: finalCode },
    })

    if (existingRole) {
      return NextResponse.json({ error: "角色编码已存在" }, { status: 400 })
    }

    const role = await prisma.role.create({
      data: {
        name,
        code: finalCode,
        sortOrder: sortOrder || 0,
        status: status || "active",
        description,
        roleMenus: {
          create: menuIds?.map((menuId: number) => ({
            menu: { connect: { id: menuId } },
          })),
        },
      },
      include: {
        roleMenus: {
          select: { menuId: true },
        },
        _count: {
          select: { userRoles: true },
        },
      },
    })

    const formattedRole = {
      ...role,
      userCount: role._count.userRoles,
      menuIds: role.roleMenus.map((rm) => rm.menuId),
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
    const { id, name, code, sortOrder, status, description, menuIds } = body

    if (!id || !name) {
      return NextResponse.json({ error: "ID和角色名称不能为空" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Prepare update data
      const updateData: any = {
        name,
        sortOrder: sortOrder || 0,
        status,
        description,
      }
      if (code) {
        updateData.code = code
      }

      const role = await tx.role.update({
        where: { id: parseInt(id) },
        data: updateData,
      })

      if (menuIds !== undefined) {
        await tx.roleMenu.deleteMany({
          where: { roleId: role.id },
        })

        if (menuIds.length > 0) {
          // Ensure unique and numbers
          const uniqueMenuIds = [...new Set(menuIds)].map((id) => Number(id))

          await tx.roleMenu.createMany({
            data: uniqueMenuIds.map((mid) => ({
              roleId: role.id,
              menuId: mid,
            })),
          })
        }
      }

      return tx.role.findUnique({
        where: { id: role.id },
        include: {
          roleMenus: {
            select: { menuId: true },
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
      menuIds: result!.roleMenus.map((rm) => rm.menuId),
    }

    return NextResponse.json(formattedRole)
  } catch (error: any) {
    console.error("[v0] Update role error:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "角色编码已存在" }, { status: 400 })
    }
    // Return actual error for debugging
    return NextResponse.json({ error: error.message || "更新角色失败" }, { status: 500 })
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
