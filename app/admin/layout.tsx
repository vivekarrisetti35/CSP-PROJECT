import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { roleHome } from "@/lib/client"
import { DashboardShell } from "@/components/app/dashboard-shell"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== "admin") {
    redirect(roleHome(user.role))
  }

  return <DashboardShell user={user}>{children}</DashboardShell>
}
