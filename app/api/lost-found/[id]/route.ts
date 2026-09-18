import { NextResponse } from "next/server"
import { db } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"
import type { LostFoundItem } from "@/lib/types"

const STATUSES: LostFoundItem["status"][] = ["open", "claimed", "returned"]

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const item = db.lostFound.find((i) => i.id === id)
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const status = body?.status
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 })
  }
  item.status = status
  return NextResponse.json({ item })
}
