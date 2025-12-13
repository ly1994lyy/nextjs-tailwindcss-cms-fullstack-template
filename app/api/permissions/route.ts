import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const type = searchParams.get("type")

    const conditions = []

    if (search) {
      conditions.push(sql`(p.name ILIKE ${`%${search}%`} OR p.code ILIKE ${`%${search}%`})`)
    }

    if (type) {
      conditions.push(sql`p.type = ${type}`)
    }

    const whereClause = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``

    const permissions = await sql`
      SELECT p.*,
        COALESCE(
          json_agg(
            json_build_object('id', r.id, 'name', r.name, 'code', r.code)
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as roles
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN roles r ON rp.role_id = r.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.sort_order, p.id
    `

    return NextResponse.json(permissions)
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

    const result = await sql`
      INSERT INTO permissions (name, code, type, sort_order, status, description)
      VALUES (${name}, ${code}, ${type}, ${sortOrder || 0}, ${status || "active"}, ${description || null})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("[v0] Create permission error:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "权限编码已存在" }, { status: 400 })
    }
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

    const result = await sql`
      UPDATE permissions
      SET name = ${name}, code = ${code}, type = ${type}, sort_order = ${sortOrder || 0}, 
          status = ${status}, description = ${description || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "权限不存在" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("[v0] Update permission error:", error)
    if (error.code === "23505") {
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

    // 检查是否有角色使用该权限
    const roles = await sql`
      SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = ${id}
    `

    if (roles[0].count > 0) {
      return NextResponse.json({ error: "该权限已被角色使用，无法删除" }, { status: 400 })
    }

    await sql`DELETE FROM permissions WHERE id = ${id}`

    return NextResponse.json({ message: "删除成功" })
  } catch (error) {
    console.error("[v0] Delete permission error:", error)
    return NextResponse.json({ error: "删除权限失败" }, { status: 500 })
  }
}
