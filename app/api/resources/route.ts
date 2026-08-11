import { NextResponse } from "next/server"
import { db, uid } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"
import type { Resource } from "@/lib/types"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ resources: [...db.resources].sort((a, b) => a.name.localeCompare(b.name)) })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 })

  const body = await req.json().catch(() => null)
  const { name, type, location } = body ?? {}
  if (!name || !type || !location) {
    return NextResponse.json({ error: "Name, type and location are required." }, { status: 400 })
  }
  const resource: Resource = {
    id: uid("res"),
    name: String(name),
    type: String(type),
    location: String(location),
    createdAt: new Date().toISOString(),
  }
  db.resources.push(resource)
  return NextResponse.json({ resource }, { status: 201 })
}
