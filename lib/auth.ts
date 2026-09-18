import { cookies } from "next/headers"
import crypto from "crypto"
import { db } from "./store"
import type { PublicUser, User } from "./types"

export const SESSION_COOKIE = "crmcrs_session"

// Secret used to sign session cookies — in production use an env var
const SECRET = process.env.SESSION_SECRET || "crmcrs-default-secret-change-me"

function sign(value: string): string {
  const hmac = crypto.createHmac("sha256", SECRET).update(value).digest("base64url")
  return `${value}.${hmac}`
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".")
  if (idx === -1) return null
  const value = signed.slice(0, idx)
  const expected = sign(value)
  // Constant-time comparison
  if (signed.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(expected))) return null
  return value
}

export function toPublic(user: User): PublicUser {
  const { password, ...rest } = user
  return rest
}

/**
 * Creates a signed session token that encodes the userId directly.
 * No server-side session store needed — works across serverless instances.
 */
export function createSession(userId: string): string {
  return sign(userId)
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const userId = verify(token)
  if (!userId) return null
  const user = db.users.find((u) => u.id === userId)
  return user ? toPublic(user) : null
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error("UNAUTHORIZED")
  return user
}
