import { NextResponse } from "next/server"
import { db, uid } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"
import type { LostFoundItem } from "@/lib/types"

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  let list = [...db.lostFound]
  if (type === "lost" || type === "found") list = list.filter((i) => i.type === type)
  list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return NextResponse.json({ items: list })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { type, title, description, location, category, contact } = body
  if (!type || !title || !location) {
    return NextResponse.json({ error: "Type, title and location are required." }, { status: 400 })
  }
  if (type !== "lost" && type !== "found") {
    return NextResponse.json({ error: "Type must be 'lost' or 'found'." }, { status: 400 })
  }

  const item: LostFoundItem = {
    id: uid("lf"),
    type,
    title: String(title),
    description: description ? String(description) : "",
    location: String(location),
    category: category ? String(category) : "Other",
    status: "open",
    reportedById: user.id,
    reportedByName: user.name,
    contact: contact ? String(contact) : user.email,
    createdAt: new Date().toISOString(),
  }
  db.lostFound.push(item)
  return NextResponse.json({ item }, { status: 201 })
}
