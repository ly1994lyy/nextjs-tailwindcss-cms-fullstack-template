import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")

    let query
    if (search) {
      query = sql`
        SELECT m.*,
          (SELECT name FROM menus WHERE id = m.parent_id) as parent_name
        FROM menus m
        WHERE m.name ILIKE ${`%${search}%`}
        ORDER BY m.sort_order, m.id
      `
    } else {
      query = sql`
        SELECT m.*,
          (SELECT name FROM menus WHERE id = m.parent_id) as parent_name
        FROM menus m
        ORDER BY m.sort_order, m.id
      `
    }

    const menus = await query

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

    const result = await sql`
      INSERT INTO menus (name, path, icon, parent_id, type, permission_code, sort_order, status)
      VALUES (${name}, ${path || null}, ${icon || null}, ${parentId || null}, ${type}, 
              ${permissionCode || null}, ${sortOrder || 0}, ${status || "active"})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
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

    const result = await sql`
      UPDATE menus
      SET name = ${name}, path = ${path || null}, icon = ${icon || null}, 
          parent_id = ${parentId || null}, type = ${type}, permission_code = ${permissionCode || null},
          sort_order = ${sortOrder || 0}, status = ${status},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "菜单不存在" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update menu error:", error)
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

    // 检查是否有子菜单
    const children = await sql`
      SELECT COUNT(*) as count FROM menus WHERE parent_id = ${id}
    `

    if (children[0].count > 0) {
      return NextResponse.json({ error: "该菜单下有子菜单，无法删除" }, { status: 400 })
    }

    await sql`DELETE FROM menus WHERE id = ${id}`

    return NextResponse.json({ message: "删除成功" })
  } catch (error) {
    console.error("[v0] Delete menu error:", error)
    return NextResponse.json({ error: "删除菜单失败" }, { status: 500 })
  }
}
