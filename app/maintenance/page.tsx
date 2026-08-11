"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Wrench, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/app/stat-card"
import { ComplaintsList } from "@/components/app/complaints-list"
import { ComplaintDialog } from "@/components/app/complaint-dialog"
import { fetcher } from "@/lib/client"
import type { Complaint, ComplaintStatus, PublicUser } from "@/lib/types"

export default function MaintenanceDashboard() {
  const { data: me } = useSWR<{ user: PublicUser }>("/api/auth/me", fetcher)
  const { data, isLoading, mutate } = useSWR<{ complaints: Complaint[] }>(
    "/api/complaints",
    fetcher,
  )

  const [tab, setTab] = useState<ComplaintStatus | "all">("all")
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [openDialog, setOpenDialog] = useState(false)

  const complaints = data?.complaints ?? []

  const stats = useMemo(() => {
    return {
      total: complaints.length,
      assigned: complaints.filter((c) => c.status === "assigned").length,
      inProgress: complaints.filter((c) => c.status === "in_progress").length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
    }
  }, [complaints])

  const filtered = useMemo(() => {
    return tab === "all" ? complaints : complaints.filter((c) => c.status === tab)
  }, [complaints, tab])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Maintenance Staff Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View, manage, and update complaints assigned to you across campus facilities.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Assigned jobs" value={stats.total} icon={Wrench} />
        <StatCard label="Pending start" value={stats.assigned} icon={AlertCircle} accent="chart-1" />
        <StatCard label="In progress" value={stats.inProgress} icon={Clock} accent="chart-3" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} accent="chart-2" />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">All assigned ({stats.total})</TabsTrigger>
              <TabsTrigger value="assigned">Pending ({stats.assigned})</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress ({stats.inProgress})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({stats.resolved})</TabsTrigger>
            </TabsList>
          </Tabs>

          <ComplaintsList
            complaints={filtered}
            isLoading={isLoading}
            emptyLabel="No maintenance tasks match this status."
            onSelect={(c) => {
              setSelected(c)
              setOpenDialog(true)
            }}
          />
        </CardContent>
      </Card>

      {me?.user && (
        <ComplaintDialog
          complaint={selected}
          viewer={me.user}
          open={openDialog}
          onOpenChange={setOpenDialog}
          onChanged={mutate}
        />
      )}
    </div>
  )
}
