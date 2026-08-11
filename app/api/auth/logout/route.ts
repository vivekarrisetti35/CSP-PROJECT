import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/store"
import { SESSION_COOKIE } from "@/lib/auth"

export async function POST() {
  const store = await cookies()
  const sessionId = store.get(SESSION_COOKIE)?.value
  if (sessionId) db.sessions.delete(sessionId)
  store.delete(SESSION_COOKIE)
  return NextResponse.json({ ok: true })
}
