import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")

    let query
    if (search) {
      query = sql`
        SELECT d.*, 
          (SELECT name FROM departments WHERE id = d.parent_id) as parent_name,
          (SELECT COUNT(*) FROM users WHERE department_id = d.id) as user_count
        FROM departments d
        WHERE d.name ILIKE ${`%${search}%`} OR d.code ILIKE ${`%${search}%`}
        ORDER BY d.sort_order, d.id
      `
    } else {
      query = sql`
        SELECT d.*, 
          (SELECT name FROM departments WHERE id = d.parent_id) as parent_name,
          (SELECT COUNT(*) FROM users WHERE department_id = d.id) as user_count
        FROM departments d
        ORDER BY d.sort_order, d.id
      `
    }

    const departments = await query

    return NextResponse.json(departments)
  } catch (error) {
    console.error("[v0] Get departments error:", error)
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

    const result = await sql`
      INSERT INTO departments (name, code, parent_id, manager, phone, email, sort_order, status, description)
      VALUES (${name}, ${code}, ${parentId || null}, ${manager || null}, ${phone || null}, 
              ${email || null}, ${sortOrder || 0}, ${status || "active"}, ${description || null})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("[v0] Create department error:", error)
    if (error.code === "23505") {
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

    const result = await sql`
      UPDATE departments
      SET name = ${name}, code = ${code}, parent_id = ${parentId || null}, 
          manager = ${manager || null}, phone = ${phone || null}, email = ${email || null},
          sort_order = ${sortOrder || 0}, status = ${status}, description = ${description || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "部门不存在" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("[v0] Update department error:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "部门编码已存在" }, { status: 400 })
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

    // 检查是否有子部门
    const children = await sql`
      SELECT COUNT(*) as count FROM departments WHERE parent_id = ${id}
    `

    if (children[0].count > 0) {
      return NextResponse.json({ error: "该部门下有子部门，无法删除" }, { status: 400 })
    }

    // 检查是否有用户
    const users = await sql`
      SELECT COUNT(*) as count FROM users WHERE department_id = ${id}
    `

    if (users[0].count > 0) {
      return NextResponse.json({ error: "该部门下有用户，无法删除" }, { status: 400 })
    }

    await sql`DELETE FROM departments WHERE id = ${id}`

    return NextResponse.json({ message: "删除成功" })
  } catch (error) {
    console.error("[v0] Delete department error:", error)
    return NextResponse.json({ error: "删除部门失败" }, { status: 500 })
  }
}
