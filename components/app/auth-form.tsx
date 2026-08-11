"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiSend, roleHome } from "@/lib/client"
import type { Role } from "@/lib/types"

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<Role>("student")
  const isRegister = mode === "register"

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const payload: Record<string, unknown> = {
      email: fd.get("email"),
      password: fd.get("password"),
    }
    if (isRegister) {
      payload.name = fd.get("name")
      payload.role = role
      payload.department = fd.get("department")
      payload.hostel = fd.get("hostel")
    }
    try {
      const url = isRegister ? "/api/auth/register" : "/api/auth/login"
      const { user } = await apiSend<{ user: { role: Role } }>(url, "POST", payload)
      toast.success(isRegister ? "Account created" : "Welcome back")
      router.push(roleHome(user.role))
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <Link href="/" className="mb-5 flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">CRMCRS</span>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {isRegister ? "Create your account" : "Sign in to your account"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
          {isRegister
            ? "Join the campus resource and complaint resolution system."
            : "Report, track, and resolve campus issues."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {isRegister && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required placeholder="Jane Doe" autoComplete="name" />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@campus.edu"
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
        </div>

        {isRegister && (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="maintenance">Maintenance Staff</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" placeholder="e.g. CSE" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="hostel">Hostel / Block</Label>
                <Input id="hostel" name="hostel" placeholder="e.g. Block C" />
              </div>
            </div>
          </>
        )}

        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {isRegister ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isRegister ? "Already have an account? " : "Don't have an account? "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-medium text-primary hover:underline"
        >
          {isRegister ? "Sign in" : "Register"}
        </Link>
      </p>

      {!isRegister && (
        <div className="mt-6 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Demo accounts (password: password)</p>
          <p>admin@campus.edu · maintenance@campus.edu · student@campus.edu · faculty@campus.edu</p>
        </div>
      )}
    </div>
  )
}
