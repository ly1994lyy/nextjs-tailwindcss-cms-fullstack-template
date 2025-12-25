import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")

    const where: any = {}

    if (search) {
      where.name = { contains: search, mode: "insensitive" }
    }

    const menus = await prisma.menu.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    })

    return NextResponse.json(menus)
  } catch (error) {
    console.error("[v0] Get menus error:", error)
    return NextResponse.json({ error: "获取菜单列表失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, path, icon, parentId, type, permissionCode, sortOrder, status } = body

    if (!name || !type) {
      return NextResponse.json({ error: "菜单名称和类型不能为空" }, { status: 400 })
    }

    const menu = await prisma.menu.create({
      data: {
        name,
        path: path || null,
        icon: icon || null,
        parentId: parentId ? parseInt(parentId) : null,
        type,
        permissionCode: permissionCode || null,
        sortOrder: sortOrder || 0,
        status: status || "active",
      },
    })

    return NextResponse.json(menu, { status: 201 })
  } catch (error) {
    console.error("[v0] Create menu error:", error)
    return NextResponse.json({ error: "创建菜单失败" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, path, icon, parentId, type, permissionCode, sortOrder, status } = body

    if (!id || !name || !type) {
      return NextResponse.json({ error: "ID、菜单名称和类型不能为空" }, { status: 400 })
    }

    const menu = await prisma.menu.update({
      where: { id: parseInt(id) },
      data: {
        name,
        path: path || null,
        icon: icon || null,
        parentId: parentId ? parseInt(parentId) : null,
        type,
        permissionCode: permissionCode || null,
        sortOrder: sortOrder || 0,
        status: status,
      },
    })

    return NextResponse.json(menu)
  } catch (error: any) {
    console.error("[v0] Update menu error:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "菜单不存在" }, { status: 404 })
    }
    return NextResponse.json({ error: "更新菜单失败" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID不能为空" }, { status: 400 })
    }

    // Check if has children
    const childCount = await prisma.menu.count({
      where: { parentId: parseInt(id) },
    })

    if (childCount > 0) {
      return NextResponse.json({ error: "该菜单下有子菜单，无法删除" }, { status: 400 })
    }

    await prisma.menu.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: "删除成功" })
  } catch (error) {
    console.error("[v0] Delete menu error:", error)
    return NextResponse.json({ error: "删除菜单失败" }, { status: 500 })
  }
}
