"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { ClipboardList, Clock, CheckCircle2, PlusCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/app/stat-card"
import { StatusBadge, PriorityBadge } from "@/components/app/badges"
import { ComplaintDialog } from "@/components/app/complaint-dialog"
import { fetcher, timeAgo, CATEGORY_LABELS } from "@/lib/client"
import type { Complaint, PublicUser } from "@/lib/types"

export default function PortalOverview() {
  const { data: me } = useSWR<{ user: PublicUser }>("/api/auth/me", fetcher)
  const { data, isLoading, mutate } = useSWR<{ complaints: Complaint[] }>(
    "/api/complaints",
    fetcher,
  )
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [open, setOpen] = useState(false)

  const complaints = data?.complaints ?? []
  const stats = useMemo(() => {
    return {
      total: complaints.length,
      open: complaints.filter((c) => !["resolved", "rejected"].includes(c.status)).length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
    }
  }, [complaints])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Welcome back{me?.user ? `, ${me.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your reported issues and campus updates.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/portal/new" />}>
          <PlusCircle className="size-4" /> New complaint
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total complaints" value={stats.total} icon={ClipboardList} />
        <StatCard label="Open" value={stats.open} icon={Clock} accent="chart-3" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} accent="chart-2" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent complaints</CardTitle>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/portal/complaints" />}>View all</Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : complaints.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                You have not reported any complaints yet.
              </p>
              <Button nativeButton={false} render={<Link href="/portal/new" />} size="sm">Report your first issue</Button>
            </div>
          ) : (
            complaints.slice(0, 5).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelected(c)
                  setOpen(true)
                }}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent/5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{c.code}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 truncate text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[c.category]} · {timeAgo(c.createdAt)}
                  </p>
                </div>
                <PriorityBadge priority={c.priority} />
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {me?.user && (
        <ComplaintDialog
          complaint={selected}
          viewer={me.user}
          open={open}
          onOpenChange={setOpen}
          onChanged={mutate}
        />
      )}
    </div>
  )
}
