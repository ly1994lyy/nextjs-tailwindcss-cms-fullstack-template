// 简单的密码哈希函数（实际生产环境应该使用 bcrypt）
export async function hashPassword(password: string): Promise<string> {
  // 这里使用简单的实现，生产环境应该使用 bcrypt
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return `$2a$10$${hashHex.substring(0, 53)}` // 模拟 bcrypt 格式
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedPassword = await hashPassword(password)
  return hashedPassword === hash
}
