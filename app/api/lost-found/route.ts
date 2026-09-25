import { NextResponse } from "next/server"
import { db, uid, saveDb } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"
import type { LostFoundItem } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const category = searchParams.get("category")
  const status = searchParams.get("status")
  const search = searchParams.get("search")?.toLowerCase()

  let list = [...(db.lostFound || [])]
  if (type === "lost" || type === "found") list = list.filter((i) => i.type === type)
  if (category && category !== "all") list = list.filter((i) => i.category === category)
  if (status && status !== "all") list = list.filter((i) => i.status === status)

  if (search) {
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(search) ||
        i.description.toLowerCase().includes(search) ||
        i.location.toLowerCase().includes(search) ||
        i.category.toLowerCase().includes(search),
    )
  }

  list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return NextResponse.json({ items: list })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { type, title, description, location, category, date, imageUrl, contact } = body
  if (!type || !title || !location) {
    return NextResponse.json({ error: "Type, title and location are required." }, { status: 400 })
  }
  if (type !== "lost" && type !== "found") {
    return NextResponse.json({ error: "Type must be 'lost' or 'found'." }, { status: 400 })
  }

  const now = new Date().toISOString()
  const item: LostFoundItem = {
    id: uid("lf"),
    type,
    title: String(title),
    description: description ? String(description) : "",
    location: String(location),
    category: category ? String(category) : "Other",
    date: date ? String(date) : now.split("T")[0],
    imageUrl: imageUrl ? String(imageUrl) : null,
    status: "open",
    reportedById: user.id,
    reportedByName: user.name,
    contact: contact ? String(contact) : user.email,
    claims: [],
    createdAt: now,
  }
  db.lostFound.push(item)
  saveDb()
  return NextResponse.json({ item }, { status: 201 })
}
