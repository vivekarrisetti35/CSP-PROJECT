import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db, uid } from "@/lib/store"
import { SESSION_COOKIE, createSession, toPublic } from "@/lib/auth"
import type { Role, User } from "@/lib/types"

const ROLES: Role[] = ["student", "faculty", "maintenance", "admin"]

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { name, email, password, role, department, hostel } = body
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Name, email, password and role are required." }, { status: 400 })
  }
  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 })
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
  }
  if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
  }

  const user: User = {
    id: uid("u"),
    name: String(name),
    email: String(email).toLowerCase(),
    password: String(password),
    role,
    department: department ? String(department) : null,
    hostel: hostel ? String(hostel) : null,
    createdAt: new Date().toISOString(),
  }
  db.users.push(user)

  const sessionId = createSession(user.id)
  const store = await cookies()
  store.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  return NextResponse.json({ user: toPublic(user) }, { status: 201 })
}
