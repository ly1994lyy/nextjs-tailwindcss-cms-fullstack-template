import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyPassword } from "@/lib/password"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 })
    }

    // 查询用户
    const users = await sql`
      SELECT 
        u.id, u.username, u.password, u.real_name, u.email, u.phone, 
        u.department_id, u.status, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.username = ${username}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 })
    }

    const user = users[0]

    if (user.status !== "active") {
      return NextResponse.json({ error: "用户已被禁用" }, { status: 403 })
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 })
    }

    // 查询用户角色
    const roles = await sql`
      SELECT r.id, r.name, r.code
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ${user.id}
    `

    // 查询用户权限
    const permissions = await sql`
      SELECT DISTINCT p.code
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ${user.id} AND p.status = 'active'
    `

    const response = {
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        email: user.email,
        phone: user.phone,
        departmentId: user.department_id,
        departmentName: user.department_name,
      },
      roles: roles.map((r) => ({ id: r.id, name: r.name, code: r.code })),
      permissions: permissions.map((p) => p.code),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "登录失败，请稍后重试" }, { status: 500 })
  }
}
