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
  if (!signed || typeof signed !== "string") return null
  const idx = signed.lastIndexOf(".")
  if (idx === -1) return null
  const value = signed.slice(0, idx)
  const expected = sign(value)
  const signedBuf = Buffer.from(signed)
  const expectedBuf = Buffer.from(expected)
  if (signedBuf.length !== expectedBuf.length) return null
  if (!crypto.timingSafeEqual(signedBuf, expectedBuf)) return null
  return value
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, hashOrPlain: string): boolean {
  if (!hashOrPlain || typeof hashOrPlain !== "string") return false
  if (!hashOrPlain.includes(":")) {
    return password === hashOrPlain
  }
  const [salt, key] = hashOrPlain.split(":")
  if (!salt || !key) return false
  const hashBuffer = crypto.scryptSync(password, salt, 64)
  const keyBuffer = Buffer.from(key, "hex")
  if (hashBuffer.length !== keyBuffer.length) return false
  return crypto.timingSafeEqual(hashBuffer, keyBuffer)
}

export function toPublic(user: User): PublicUser {
  const { password, ...rest } = user
  return rest
}

/**
 * Creates a signed session token that encodes the user profile directly.
 * No server-side session store needed — works across serverless instances.
 */
export function createSession(userOrId: User | PublicUser | string): string {
  if (typeof userOrId === "string") {
    const existing = db.users.find((u) => u.id === userOrId)
    if (existing) {
      return sign(JSON.stringify(toPublic(existing)))
    }
    return sign(JSON.stringify({ id: userOrId, name: "User", email: "", role: "student", department: null, hostel: null, createdAt: new Date().toISOString() }))
  }
  const pub = "password" in userOrId ? toPublic(userOrId) : userOrId
  return sign(JSON.stringify(pub))
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    const raw = verify(token)
    if (!raw) return null

    if (raw.startsWith("{")) {
      const parsedUser = JSON.parse(raw) as PublicUser
      if (parsedUser && parsedUser.id && parsedUser.role) {
        const existing = db.users.find((u) => u.id === parsedUser.id)
        if (existing) {
          return toPublic(existing)
        }
        db.users.push({
          ...parsedUser,
          password: "",
        })
        return parsedUser
      }
    }

    // Legacy userId token fallback
    const user = db.users.find((u) => u.id === raw)
    return user ? toPublic(user) : null
  } catch {
    return null
  }
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error("UNAUTHORIZED")
  return user
}
