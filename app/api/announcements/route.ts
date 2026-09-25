import { NextResponse } from "next/server"
import { db, uid, saveDb } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"
import type { Announcement } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({
    announcements: [...db.announcements].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 })

  const body = await req.json().catch(() => null)
  const { title, body: text } = body ?? {}
  if (!title || !text) {
    return NextResponse.json({ error: "Title and body are required." }, { status: 400 })
  }
  const now = new Date().toISOString()
  const announcement: Announcement = {
    id: uid("a"),
    title: String(title),
    body: String(text),
    authorName: user.name,
    createdAt: now,
  }
  db.announcements.push(announcement)

  // Broadcast a notification to everyone else
  db.users
    .filter((u) => u.id !== user.id)
    .forEach((u) => {
      db.notifications.push({
        id: uid("n"),
        userId: u.id,
        message: `Announcement: ${announcement.title}`,
        href: null,
        read: false,
        createdAt: now,
      })
    })
  saveDb()

  return NextResponse.json({ announcement }, { status: 201 })
}
