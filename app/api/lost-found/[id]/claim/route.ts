import { NextResponse } from "next/server"
import { db, uid, saveDb } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"
import type { ClaimRequest } from "@/lib/types"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const item = db.lostFound.find((i) => i.id === id)
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })

  if (item.type !== "found") {
    return NextResponse.json({ error: "Claim requests can only be submitted for found items." }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const { proofDetails, contact } = body ?? {}
  if (!proofDetails) {
    return NextResponse.json({ error: "Proof details are required to submit a claim request." }, { status: 400 })
  }

  if (!item.claims) item.claims = []

  // Check if user already submitted a pending claim
  const existing = item.claims.find((c) => c.claimedById === user.id && c.status === "pending")
  if (existing) {
    return NextResponse.json({ error: "You already have a pending claim request for this item." }, { status: 400 })
  }

  const now = new Date().toISOString()
  const claim: ClaimRequest = {
    id: uid("clm"),
    itemId: item.id,
    claimedById: user.id,
    claimedByName: user.name,
    claimedByContact: contact ? String(contact) : user.email,
    proofDetails: String(proofDetails),
    status: "pending",
    createdAt: now,
  }

  item.claims.push(claim)

  // Notify the item reporter
  db.notifications.push({
    id: uid("n"),
    userId: item.reportedById,
    message: `${user.name} submitted a claim request for "${item.title}".`,
    href: item.reportedById === user.id ? "/portal/lost-found" : "/admin/lost-found",
    read: false,
    createdAt: now,
  })

  saveDb()
  return NextResponse.json({ claim, item }, { status: 201 })
}
