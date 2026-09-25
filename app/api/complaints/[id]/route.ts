import { NextResponse } from "next/server"
import { db, uid, saveDb } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"
import type { ComplaintStatus, Priority } from "@/lib/types"

export const dynamic = "force-dynamic"

const STATUSES: ComplaintStatus[] = ["pending", "assigned", "in_progress", "resolved", "rejected"]
const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"]

function notify(userId: string | null, message: string, href: string) {
  if (!userId) return
  db.notifications.push({
    id: uid("n"),
    userId,
    message,
    href,
    read: false,
    createdAt: new Date().toISOString(),
  })
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const complaint = db.complaints.find((c) => c.id === id)
  if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ complaint })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const complaint = db.complaints.find((c) => c.id === id)
  if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { status, priority, assignedToId, feedback } = body

  // Assign a complaint (admin only)
  if (assignedToId !== undefined) {
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can assign complaints." }, { status: 403 })
    }
    if (assignedToId === null) {
      complaint.assignedToId = null
      complaint.assignedToName = null
    } else {
      const worker = db.users.find((u) => u.id === assignedToId && u.role === "maintenance")
      if (!worker) return NextResponse.json({ error: "Invalid maintenance user." }, { status: 400 })
      complaint.assignedToId = worker.id
      complaint.assignedToName = worker.name
      if (complaint.status === "pending") complaint.status = "assigned"
      notify(worker.id, `Complaint ${complaint.code} assigned to you.`, "/maintenance")
    }
  }

  // Priority (admin only)
  if (priority !== undefined) {
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can change priority." }, { status: 403 })
    }
    if (!PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority." }, { status: 400 })
    }
    complaint.priority = priority
  }

  // Status changes
  if (status !== undefined) {
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 })
    }
    const isOwnerMaintenance = user.role === "maintenance" && complaint.assignedToId === user.id
    if (user.role !== "admin" && !isOwnerMaintenance) {
      return NextResponse.json({ error: "Not allowed to update this complaint." }, { status: 403 })
    }
    complaint.status = status
    notify(
      complaint.submittedById,
      `Your complaint ${complaint.code} is now "${status.replace("_", " ")}".`,
      "/portal/complaints",
    )
  }

  // Feedback (submitter only, on resolved complaints)
  if (feedback !== undefined) {
    if (complaint.submittedById !== user.id) {
      return NextResponse.json({ error: "Only the submitter can leave feedback." }, { status: 403 })
    }
    if (complaint.status !== "resolved") {
      return NextResponse.json({ error: "Feedback is only for resolved complaints." }, { status: 400 })
    }
    const rating = Number(feedback.rating)
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 })
    }
    complaint.feedback = {
      rating,
      comment: feedback.comment ? String(feedback.comment) : "",
      createdAt: new Date().toISOString(),
    }
  }

  complaint.updatedAt = new Date().toISOString()
  saveDb()
  return NextResponse.json({ complaint })
}
