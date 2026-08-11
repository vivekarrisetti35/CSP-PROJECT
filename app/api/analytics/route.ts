import { NextResponse } from "next/server"
import { db } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 })

  const complaints = db.complaints

  const byStatus = ["pending", "assigned", "in_progress", "resolved", "rejected"].map((status) => ({
    status,
    count: complaints.filter((c) => c.status === status).length,
  }))

  const byCategory = ["electrical", "plumbing", "furniture", "cleaning", "network", "civil", "other"].map(
    (category) => ({
      category,
      count: complaints.filter((c) => c.category === category).length,
    }),
  )

  const byPriority = ["low", "medium", "high", "urgent"].map((priority) => ({
    priority,
    count: complaints.filter((c) => c.priority === priority).length,
  }))

  // Complaints over the last 7 days
  const trend: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const count = complaints.filter((c) => {
      const created = new Date(c.createdAt)
      return created >= d && created < next
    }).length
    trend.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count })
  }

  const resolved = complaints.filter((c) => c.status === "resolved")
  const avgResolutionHours =
    resolved.length === 0
      ? 0
      : Math.round(
          resolved.reduce((sum, c) => {
            const diff = new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()
            return sum + diff / (1000 * 60 * 60)
          }, 0) / resolved.length,
        )

  const ratings = complaints.filter((c) => c.feedback).map((c) => c.feedback!.rating)
  const avgRating = ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 0

  return NextResponse.json({
    totals: {
      complaints: complaints.length,
      pending: complaints.filter((c) => c.status === "pending").length,
      resolved: resolved.length,
      users: db.users.length,
      resources: db.resources.length,
      lostFound: db.lostFound.length,
      avgResolutionHours,
      avgRating,
    },
    byStatus,
    byCategory,
    byPriority,
    trend,
  })
}
