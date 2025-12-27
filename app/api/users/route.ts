import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hashPassword } from "@/lib/password"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const departmentId = searchParams.get("departmentId")

    const where: any = {}

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { realName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    if (departmentId) {
      where.departmentId = parseInt(departmentId)
    }

    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const skip = (page - 1) * pageSize

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          department: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    // Transform data to flat structure if needed, or return as is.
    // Returning as is but keeping in mind the frontend needs customization
    const formattedUsers = users.map((user) => ({
      ...user,
      departmentName: user.department?.name,
      roles: user.userRoles.map((ur) => ur.role),
    }))

    return NextResponse.json({
      data: formattedUsers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("[v0] Get users error:", error)
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, realName, email, phone, departmentId, roleIds, status } = body

    if (!username || !password || !realName) {
      return NextResponse.json({ error: "用户名、密码和真实姓名不能为空" }, { status: 400 })
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json({ error: "用户名已存在" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        realName,
        email,
        phone,
        departmentId: departmentId ? parseInt(departmentId) : null,
        status: status || "active",
        userRoles: {
          create: roleIds?.map((roleId: string) => ({
            role: { connect: { id: parseInt(roleId) } },
          })),
        },
      },
      include: {
        department: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    const formattedUser = {
      ...user,
      departmentName: user.department?.name,
      roles: user.userRoles.map((ur) => ur.role),
    }

    return NextResponse.json(formattedUser, { status: 201 })
  } catch (error) {
    console.error("[v0] Create user error:", error)
    return NextResponse.json({ error: "创建用户失败" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, username, password, realName, email, phone, departmentId, roleIds, status } = body

    if (!id || !username || !realName) {
      return NextResponse.json({ error: "ID、用户名和真实姓名不能为空" }, { status: 400 })
    }

    const dataToUpdate: any = {
      username,
      realName,
      email,
      phone,
      departmentId: departmentId ? parseInt(departmentId) : null,
      status,
    }

    if (password) {
      dataToUpdate.password = await hashPassword(password)
    }

    // Manage roles transactionally: delete all existing, insert new
    // Prisma doesn't support "sync" directly on many-to-many through join table easily in one go without deleteMany specific to user
    // But here we can use `userRoles` relation update.

    // Better approach for explicit join table:
    // 1. Update user details
    // 2. Handle roles using transaction or nested writes

    // Using transaction for safety
    const result = await prisma.$transaction(async (tx) => {
      // Update basic fields
      const user = await tx.user.update({
        where: { id: parseInt(id) },
        data: dataToUpdate,
      })

      if (roleIds !== undefined) {
        // Delete existing roles
        await tx.userRole.deleteMany({
          where: { userId: user.id },
        })

        // Create new roles
        if (roleIds.length > 0) {
          await tx.userRole.createMany({
            data: roleIds.map((roleId: string) => ({
              userId: user.id,
              roleId: parseInt(roleId),
            })),
          })
        }
      }

      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          department: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      })
    })

    const formattedUser = {
      ...result!,
      departmentName: result?.department?.name,
      roles: result?.userRoles.map((ur) => ur.role),
    }

    return NextResponse.json(formattedUser)
  } catch (error: any) {
    console.error("[v0] Update user error:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "用户名已存在" }, { status: 400 })
    }
    return NextResponse.json({ error: "更新用户失败" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID不能为空" }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: "删除成功" })
  } catch (error) {
    console.error("[v0] Delete user error:", error)
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 })
  }
}
