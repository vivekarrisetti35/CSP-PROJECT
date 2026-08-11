import { NextResponse } from "next/server"
import { db } from "@/lib/store"

// Public lookup so a scanned QR can show what is being reported before login.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resource = db.resources.find((r) => r.id === id)
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ resource })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getCurrentUser } = await import("@/lib/auth")
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 })

  const { id } = await params
  const idx = db.resources.findIndex((r) => r.id === id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })

  db.resources.splice(idx, 1)
  return NextResponse.json({ ok: true })
}

