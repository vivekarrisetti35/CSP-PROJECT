"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import useSWR from "swr"
import {
  Bell,
  Boxes,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Menu,
  PackageSearch,
  Users,
  Wrench,
  BarChart3,
  PlusCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ROLE_LABELS, apiSend, fetcher, timeAgo } from "@/lib/client"
import type { Notification, PublicUser } from "@/lib/types"

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }

const NAV: Record<string, NavItem[]> = {
  student: [
    { href: "/portal", label: "Overview", icon: LayoutDashboard },
    { href: "/portal/complaints", label: "My Complaints", icon: ListChecks },
    { href: "/portal/new", label: "New Complaint", icon: PlusCircle },
    { href: "/portal/lost-found", label: "Lost & Found", icon: PackageSearch },
  ],
  faculty: [
    { href: "/portal", label: "Overview", icon: LayoutDashboard },
    { href: "/portal/complaints", label: "My Complaints", icon: ListChecks },
    { href: "/portal/new", label: "New Complaint", icon: PlusCircle },
    { href: "/portal/lost-found", label: "Lost & Found", icon: PackageSearch },
  ],
  maintenance: [
    { href: "/maintenance", label: "Assigned Work", icon: Wrench },
    { href: "/maintenance/lost-found", label: "Lost & Found", icon: PackageSearch },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/complaints", label: "Complaints", icon: ListChecks },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/resources", label: "Resources", icon: Boxes },
    { href: "/admin/lost-found", label: "Lost & Found", icon: PackageSearch },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  ],
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function DashboardShell({
  user,
  children,
}: {
  user: PublicUser
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const nav = NAV[user.role] ?? []

  const { data, mutate } = useSWR<{ notifications: Notification[]; unread: number }>(
    "/api/notifications",
    fetcher,
    { refreshInterval: 15000 },
  )

  async function logout() {
    await apiSend("/api/auth/logout", "POST")
    router.push("/login")
    router.refresh()
  }

  async function markAllRead() {
    await apiSend("/api/notifications", "PATCH", {})
    mutate()
  }

  const NavLinks = (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Wrench className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-sidebar-foreground">CRMCRS</p>
            <p className="text-[11px] text-muted-foreground">Campus Resolution</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{NavLinks}</div>
        <div className="border-t border-sidebar-border p-3">
          <p className="px-3 pb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            {ROLE_LABELS[user.role]}
          </p>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground"
            onClick={logout}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            {/* Mobile menu */}
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="lg:hidden" />}>
                <Menu className="size-4" />
                <span className="sr-only">Open menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {nav.map((item) => (
                  <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                    <item.icon className="size-4" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm font-medium text-muted-foreground">
              {ROLE_LABELS[user.role]} Portal
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="relative" />}>
                <Bell className="size-4" />
                {data && data.unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
                    {data.unread > 9 ? "9+" : data.unread}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuGroup>
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                    {data && data.unread > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {data && data.notifications.length > 0 ? (
                    data.notifications.slice(0, 12).map((n) => (
                      <DropdownMenuItem key={n.id} className="items-start gap-2" render={<Link href={n.href ?? "#"} />}>
                        {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                        <span className={cn("flex flex-col gap-0.5", n.read && "opacity-60")}>
                          <span className="text-sm leading-snug">{n.message}</span>
                          <span className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                        </span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </p>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger render={<button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" />}>
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
