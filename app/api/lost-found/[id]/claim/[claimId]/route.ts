import { NextResponse } from "next/server"
import { db, uid, saveDb } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; claimId: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, claimId } = await params
  const item = db.lostFound.find((i) => i.id === id)
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })

  const isOwnerOrAdmin = user.role === "admin" || item.reportedById === user.id
  if (!isOwnerOrAdmin) {
    return NextResponse.json({ error: "Only the item reporter or an admin can review claims." }, { status: 403 })
  }

  const claim = item.claims?.find((c) => c.id === claimId)
  if (!claim) return NextResponse.json({ error: "Claim request not found" }, { status: 404 })

  const body = await req.json().catch(() => null)
  const status = body?.status
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "Status must be 'approved' or 'rejected'." }, { status: 400 })
  }

  claim.status = status
  const now = new Date().toISOString()

  if (status === "approved") {
    item.status = item.type === "lost" ? "claimed" : "returned"
    // Reject other pending claims
    item.claims?.forEach((c) => {
      if (c.id !== claim.id && c.status === "pending") {
        c.status = "rejected"
      }
    })
  }

  // Notify the claimant
  db.notifications.push({
    id: uid("n"),
    userId: claim.claimedById,
    message: `Your claim request for "${item.title}" was ${status}.`,
    href: "/portal/lost-found",
    read: false,
    createdAt: now,
  })

  saveDb()
  return NextResponse.json({ claim, item })
}
