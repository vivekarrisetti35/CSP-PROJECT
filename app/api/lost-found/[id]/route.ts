import { NextResponse } from "next/server"
import { db, saveDb } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"
import type { LostFoundItem } from "@/lib/types"

const STATUSES: LostFoundItem["status"][] = ["open", "claimed", "returned"]

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const item = db.lostFound.find((i) => i.id === id)
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ item })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const item = db.lostFound.find((i) => i.id === id)
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isOwnerOrAdmin = user.role === "admin" || item.reportedById === user.id
  if (!isOwnerOrAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const status = body?.status
  if (status && STATUSES.includes(status)) {
    item.status = status
  }
  if (body?.title) item.title = String(body.title)
  if (body?.description !== undefined) item.description = String(body.description)
  if (body?.location) item.location = String(body.location)
  if (body?.category) item.category = String(body.category)
  if (body?.contact) item.contact = String(body.contact)
  if (body?.imageUrl !== undefined) item.imageUrl = body.imageUrl ? String(body.imageUrl) : null

  saveDb()
  return NextResponse.json({ item })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const idx = db.lostFound.findIndex((i) => i.id === id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const item = db.lostFound[idx]
  const isOwnerOrAdmin = user.role === "admin" || item.reportedById === user.id
  if (!isOwnerOrAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  db.lostFound.splice(idx, 1)
  saveDb()
  return NextResponse.json({ ok: true })
}
