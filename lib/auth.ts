import { cookies } from "next/headers"
import { db, uid } from "./store"
import type { PublicUser, User } from "./types"

export const SESSION_COOKIE = "crmcrs_session"

export function toPublic(user: User): PublicUser {
  const { password, ...rest } = user
  return rest
}

export function createSession(userId: string) {
  const sessionId = uid("sess")
  db.sessions.set(sessionId, userId)
  return sessionId
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const store = await cookies()
  const sessionId = store.get(SESSION_COOKIE)?.value
  if (!sessionId) return null
  const userId = db.sessions.get(sessionId)
  if (!userId) return null
  const user = db.users.find((u) => u.id === userId)
  return user ? toPublic(user) : null
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error("UNAUTHORIZED")
  return user
}
