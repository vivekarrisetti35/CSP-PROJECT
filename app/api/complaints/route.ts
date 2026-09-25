import { NextResponse } from "next/server"
import { db, nextCode, uid, saveDb } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"
import type { Complaint, ComplaintCategory, Priority } from "@/lib/types"

const CATEGORIES: ComplaintCategory[] = [
  "electrical",
  "plumbing",
  "furniture",
  "cleaning",
  "network",
  "civil",
  "other",
]
const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"]

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const category = searchParams.get("category")

  let list = [...db.complaints]
  if (user.role === "student" || user.role === "faculty") {
    list = list.filter((c) => c.submittedById === user.id)
  } else if (user.role === "maintenance") {
    list = list.filter((c) => c.assignedToId === user.id)
  }
  if (status) list = list.filter((c) => c.status === status)
  if (category) list = list.filter((c) => c.category === category)

  list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return NextResponse.json({ complaints: list })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { title, description, category, priority, location, resourceId } = body
  if (!title || !description || !category || !location) {
    return NextResponse.json(
      { error: "Title, description, category and location are required." },
      { status: 400 },
    )
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 })
  }
  const finalPriority: Priority = PRIORITIES.includes(priority) ? priority : "medium"

  const now = new Date().toISOString()
  const complaint: Complaint = {
    id: uid("c"),
    code: nextCode(),
    title: String(title),
    description: String(description),
    category,
    priority: finalPriority,
    location: String(location),
    resourceId: resourceId ? String(resourceId) : null,
    status: "pending",
    submittedById: user.id,
    submittedByName: user.name,
    assignedToId: null,
    assignedToName: null,
    feedback: null,
    createdAt: now,
    updatedAt: now,
  }
  db.complaints.push(complaint)

  // Notify all admins
  db.users
    .filter((u) => u.role === "admin")
    .forEach((admin) => {
      db.notifications.push({
        id: uid("n"),
        userId: admin.id,
        message: `New complaint ${complaint.code}: ${complaint.title}`,
        href: "/admin/complaints",
        read: false,
        createdAt: now,
      })
    })
  saveDb()

  return NextResponse.json({ complaint }, { status: 201 })
}
