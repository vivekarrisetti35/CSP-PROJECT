import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/store"
import { SESSION_COOKIE, createSession, toPublic, verifyPassword } from "@/lib/auth"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { email, password } = body
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
  }

  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
  if (!user || !verifyPassword(String(password), user.password)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
  }

  const sessionId = createSession(user.id)
  const res = NextResponse.json({ user: toPublic(user) })
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  })

  return res
}
