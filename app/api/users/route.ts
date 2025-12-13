import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/password"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const departmentId = searchParams.get("departmentId")

    const conditions = []
    const params: any = {}

    if (search) {
      conditions.push(
        `(u.username ILIKE $search OR u.real_name ILIKE $search OR u.email ILIKE $search)`,
      )
      params.search = `%${search}%`
    }

    if (departmentId) {
      conditions.push(`u.department_id = $departmentId`)
      params.departmentId = departmentId
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const users = await sql`
      SELECT 
        u.id, u.username, u.real_name, u.email, u.phone, 
        u.department_id, u.status, u.created_at,
        d.name as department_name,
        COALESCE(
          json_agg(
            json_build_object('id', r.id, 'name', r.name, 'code', r.code)
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as roles
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      ${search || departmentId ? sql`WHERE` : sql``}
      ${search ? sql`(u.username ILIKE ${`%${search}%`} OR u.real_name ILIKE ${`%${search}%`} OR u.email ILIKE ${`%${search}%`})` : sql``}
      ${search && departmentId ? sql`AND` : sql``}
      ${departmentId ? sql`u.department_id = ${departmentId}` : sql``}
      GROUP BY u.id, d.name
      ORDER BY u.id
    `

    return NextResponse.json(users)
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

    // 哈希密码
    const hashedPassword = await hashPassword(password)

    // 创建用户
    const result = await sql`
      INSERT INTO users (username, password, real_name, email, phone, department_id, status)
      VALUES (${username}, ${hashedPassword}, ${realName}, ${email || null}, ${phone || null}, 
              ${departmentId || null}, ${status || "active"})
      RETURNING id, username, real_name, email, phone, department_id, status, created_at
    `

    const user = result[0]

    // 分配角色
    if (roleIds && roleIds.length > 0) {
      for (const roleId of roleIds) {
        await sql`
          INSERT INTO user_roles (user_id, role_id)
          VALUES (${user.id}, ${roleId})
        `
      }
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Create user error:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "用户名已存在" }, { status: 400 })
    }
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

    // 更新用户基本信息
    let updateQuery
    if (password) {
      const hashedPassword = await hashPassword(password)
      updateQuery = sql`
        UPDATE users
        SET username = ${username}, password = ${hashedPassword}, real_name = ${realName}, 
            email = ${email || null}, phone = ${phone || null}, department_id = ${departmentId || null},
            status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id, username, real_name, email, phone, department_id, status
      `
    } else {
      updateQuery = sql`
        UPDATE users
        SET username = ${username}, real_name = ${realName}, email = ${email || null}, 
            phone = ${phone || null}, department_id = ${departmentId || null},
            status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id, username, real_name, email, phone, department_id, status
      `
    }

    const result = await updateQuery

    if (result.length === 0) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 更新角色关联
    if (roleIds !== undefined) {
      // 删除旧的角色关联
      await sql`DELETE FROM user_roles WHERE user_id = ${id}`

      // 添加新的角色关联
      if (roleIds.length > 0) {
        for (const roleId of roleIds) {
          await sql`
            INSERT INTO user_roles (user_id, role_id)
            VALUES (${id}, ${roleId})
          `
        }
      }
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("[v0] Update user error:", error)
    if (error.code === "23505") {
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

    await sql`DELETE FROM users WHERE id = ${id}`

    return NextResponse.json({ message: "删除成功" })
  } catch (error) {
    console.error("[v0] Delete user error:", error)
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 })
  }
}
