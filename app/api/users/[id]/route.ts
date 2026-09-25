import { NextResponse } from "next/server"
import { db, saveDb } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 })

  const { id } = await params
  if (id === user.id) return NextResponse.json({ error: "You cannot delete yourself." }, { status: 400 })

  const idx = db.users.findIndex((u) => u.id === id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
  db.users.splice(idx, 1)
  saveDb()
  return NextResponse.json({ ok: true })
}
