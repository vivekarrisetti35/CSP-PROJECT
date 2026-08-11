import { NextResponse } from "next/server"
import { db } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const list = db.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return NextResponse.json({ notifications: list, unread: list.filter((n) => !n.read).length })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = body?.id
  db.notifications
    .filter((n) => n.userId === user.id && (id ? n.id === id : true))
    .forEach((n) => (n.read = true))
  return NextResponse.json({ ok: true })
}
