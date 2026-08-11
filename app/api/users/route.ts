import { NextResponse } from "next/server"
import { db } from "@/lib/store"
import { getCurrentUser, toPublic } from "@/lib/auth"

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const role = searchParams.get("role")

  // Maintenance list is needed by admins to assign; full list is admin-only.
  if (role === "maintenance" && (user.role === "admin")) {
    const workers = db.users.filter((u) => u.role === "maintenance").map(toPublic)
    return NextResponse.json({ users: workers })
  }

  if (user.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 })

  let list = db.users
  if (role) list = list.filter((u) => u.role === role)
  return NextResponse.json({
    users: list.map(toPublic).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  })
}
