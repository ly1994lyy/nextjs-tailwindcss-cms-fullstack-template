import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")

    let query
    if (search) {
      query = sql`
        SELECT r.*,
          (SELECT COUNT(*) FROM user_roles WHERE role_id = r.id) as user_count,
          COALESCE(
            json_agg(
              json_build_object('id', p.id, 'name', p.name, 'code', p.code, 'type', p.type)
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'
          ) as permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE r.name ILIKE ${`%${search}%`} OR r.code ILIKE ${`%${search}%`}
        GROUP BY r.id
        ORDER BY r.sort_order, r.id
      `
    } else {
      query = sql`
        SELECT r.*,
          (SELECT COUNT(*) FROM user_roles WHERE role_id = r.id) as user_count,
          COALESCE(
            json_agg(
              json_build_object('id', p.id, 'name', p.name, 'code', p.code, 'type', p.type)
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'
          ) as permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        GROUP BY r.id
        ORDER BY r.sort_order, r.id
      `
    }

    const roles = await query

    return NextResponse.json(roles)
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

    // 创建角色
    const result = await sql`
      INSERT INTO roles (name, code, sort_order, status, description)
      VALUES (${name}, ${code}, ${sortOrder || 0}, ${status || "active"}, ${description || null})
      RETURNING *
    `

    const role = result[0]

    // 分配权限
    if (permissionIds && permissionIds.length > 0) {
      for (const permissionId of permissionIds) {
        await sql`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (${role.id}, ${permissionId})
        `
      }
    }

    return NextResponse.json(role, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Create role error:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "角色编码已存在" }, { status: 400 })
    }
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

    // 更新角色基本信息
    const result = await sql`
      UPDATE roles
      SET name = ${name}, code = ${code}, sort_order = ${sortOrder || 0}, 
          status = ${status}, description = ${description || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 })
    }

    // 更新权限关联
    if (permissionIds !== undefined) {
      // 删除旧的权限关联
      await sql`DELETE FROM role_permissions WHERE role_id = ${id}`

      // 添加新的权限关联
      if (permissionIds.length > 0) {
        for (const permissionId of permissionIds) {
          await sql`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (${id}, ${permissionId})
          `
        }
      }
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("[v0] Update role error:", error)
    if (error.code === "23505") {
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

    // 检查是否有用户使用该角色
    const users = await sql`
      SELECT COUNT(*) as count FROM user_roles WHERE role_id = ${id}
    `

    if (users[0].count > 0) {
      return NextResponse.json({ error: "该角色下有用户，无法删除" }, { status: 400 })
    }

    await sql`DELETE FROM roles WHERE id = ${id}`

    return NextResponse.json({ message: "删除成功" })
  } catch (error) {
    console.error("[v0] Delete role error:", error)
    return NextResponse.json({ error: "删除角色失败" }, { status: 500 })
  }
}
