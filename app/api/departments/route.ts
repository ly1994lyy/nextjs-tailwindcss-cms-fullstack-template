import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}

    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const skip = (page - 1) * pageSize

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        include: {
          parent: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        skip,
        take: pageSize,
      }),
      prisma.department.count({ where }),
    ])

    const formattedDepartments = departments.map((dept) => ({
      ...dept,
      parentName: dept.parent?.name,
      userCount: dept._count.users,
    }))

    return NextResponse.json({
      data: formattedDepartments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("[Get Departments] Error:", error)
    return NextResponse.json({ error: "获取部门列表失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, parentId, manager, phone, email, sortOrder, status, description } = body

    if (!name || !code) {
      return NextResponse.json({ error: "部门名称和编码不能为空" }, { status: 400 })
    }

    const payload: any = {
      name,
      code,
      manager,
      phone,
      email,
      sortOrder: sortOrder || 0,
      status: status || "active",
      description,
    }

    if (parentId && parentId !== "") {
      payload.parentId = parseInt(parentId)
    }

    const department = await prisma.department.create({
      data: payload,
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error: any) {
    console.error("[Create Department] Error:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "部门编码已存在" }, { status: 400 })
    }
    return NextResponse.json({ error: "创建部门失败" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, code, parentId, manager, phone, email, sortOrder, status, description } = body

    if (!id || !name || !code) {
      return NextResponse.json({ error: "ID、部门名称和编码不能为空" }, { status: 400 })
    }

    const payload: any = {
      name,
      code,
      manager,
      phone,
      email,
      sortOrder: sortOrder || 0,
      status: status || "active",
      description,
    }

    if (parentId && parentId !== "") {
      payload.parentId = parseInt(parentId)
    } else {
      payload.parentId = null
    }

    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: payload,
    })

    return NextResponse.json(department)
  } catch (error: any) {
    console.error("[Update Department] Error:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "部门编码已存在" }, { status: 400 })
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "部门不存在" }, { status: 404 })
    }
    return NextResponse.json({ error: "更新部门失败" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID不能为空" }, { status: 400 })
    }

    const departmentId = parseInt(id)

    // Check for children
    const childCount = await prisma.department.count({
      where: { parentId: departmentId },
    })

    if (childCount > 0) {
      return NextResponse.json({ error: "该部门下有子部门，无法删除" }, { status: 400 })
    }

    // Check for users
    const userCount = await prisma.user.count({
      where: { departmentId: departmentId },
    })

    if (userCount > 0) {
      return NextResponse.json({ error: "该部门下有用户，无法删除" }, { status: 400 })
    }

    await prisma.department.delete({
      where: { id: departmentId },
    })

    return NextResponse.json({ message: "删除成功" })
  } catch (error) {
    console.error("[Delete Department] Error:", error)
    return NextResponse.json({ error: "删除部门失败" }, { status: 500 })
  }
}
