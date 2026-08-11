"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  AlertCircle,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock,
  ListChecks,
  Megaphone,
  Users,
  Wrench,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/app/stat-card"
import { ComplaintsList } from "@/components/app/complaints-list"
import { ComplaintDialog } from "@/components/app/complaint-dialog"
import { fetcher } from "@/lib/client"
import type { Complaint, PublicUser } from "@/lib/types"

export default function AdminDashboard() {
  const { data: me } = useSWR<{ user: PublicUser }>("/api/auth/me", fetcher)
  const { data: analytics } = useSWR<any>("/api/analytics", fetcher)
  const { data: complaintsData, isLoading, mutate } = useSWR<{ complaints: Complaint[] }>(
    "/api/complaints",
    fetcher,
  )
  const { data: workersData } = useSWR<{ users: PublicUser[] }>(
    "/api/users?role=maintenance",
    fetcher,
  )

  const [selected, setSelected] = useState<Complaint | null>(null)
  const [openDialog, setOpenDialog] = useState(false)

  const complaints = complaintsData?.complaints ?? []
  const workers = workersData?.users ?? []
  const totals = analytics?.totals ?? {
    complaints: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
    users: 0,
    resources: 0,
  }

  const unassigned = complaints.filter((c) => c.status === "pending" || !c.assignedToId)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Campus-wide complaint triage, resource oversight, and system statistics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/admin/analytics" />}>
            <BarChart3 className="mr-1.5 size-4" /> Analytics
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/admin/resources" />}>
            <Boxes className="mr-1.5 size-4" /> Resources & QR
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/admin/announcements" />}>
            <Megaphone className="mr-1.5 size-4" /> Broadcast Notice
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total complaints" value={totals.complaints} icon={ListChecks} />
        <StatCard label="Requires assignment" value={totals.pending} icon={AlertCircle} accent="chart-1" />
        <StatCard label="Resolved issues" value={totals.resolved} icon={CheckCircle2} accent="chart-2" />
        <StatCard label="Registered users" value={totals.users} icon={Users} accent="chart-5" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Unassigned Triage Column */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Unassigned Complaints ({unassigned.length})</CardTitle>
              <CardDescription>Issues waiting for maintenance worker assignment.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/complaints" />}>View all</Button>
          </CardHeader>
          <CardContent>
            <ComplaintsList
              complaints={unassigned.slice(0, 6)}
              isLoading={isLoading}
              emptyLabel="No pending unassigned complaints! Everything is routed."
              showAssignee
              onSelect={(c) => {
                setSelected(c)
                setOpenDialog(true)
              }}
            />
          </CardContent>
        </Card>

        {/* Quick Links & Shortcuts */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Management Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start gap-2" nativeButton={false} render={<Link href="/admin/complaints" />}>
                <ListChecks className="size-4 text-primary" /> Manage All Complaints
              </Button>
              <Button variant="outline" className="justify-start gap-2" nativeButton={false} render={<Link href="/admin/users" />}>
                <Users className="size-4 text-primary" /> Manage Users & Staff
              </Button>
              <Button variant="outline" className="justify-start gap-2" nativeButton={false} render={<Link href="/admin/resources" />}>
                <Boxes className="size-4 text-primary" /> Manage Resources & QR Codes
              </Button>
              <Button variant="outline" className="justify-start gap-2" nativeButton={false} render={<Link href="/admin/announcements" />}>
                <Megaphone className="size-4 text-primary" /> Broadcast Announcements
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Staff Status</CardTitle>
              <CardDescription>{workers.length} active maintenance staff</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {workers.map((w) => {
                const assignedCount = complaints.filter(
                  (c) => c.assignedToId === w.id && c.status !== "resolved",
                ).length
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3.5 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Wrench className="size-4 text-muted-foreground" />
                      <span className="font-medium">{w.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {assignedCount} active jobs
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {me?.user && (
        <ComplaintDialog
          complaint={selected}
          viewer={me.user}
          workers={workers}
          open={openDialog}
          onOpenChange={setOpenDialog}
          onChanged={mutate}
        />
      )}
    </div>
  )
}
