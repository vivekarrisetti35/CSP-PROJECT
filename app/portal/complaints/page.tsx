"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ComplaintsList } from "@/components/app/complaints-list"
import { ComplaintDialog } from "@/components/app/complaint-dialog"
import { fetcher, STATUS_LABELS } from "@/lib/client"
import type { Complaint, ComplaintStatus, PublicUser } from "@/lib/types"

const STATUSES: (ComplaintStatus | "all")[] = [
  "all",
  "pending",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
]

export default function MyComplaintsPage() {
  const { data: me } = useSWR<{ user: PublicUser }>("/api/auth/me", fetcher)
  const { data, isLoading, mutate } = useSWR<{ complaints: Complaint[] }>(
    "/api/complaints",
    fetcher,
  )
  const [status, setStatus] = useState<ComplaintStatus | "all">("all")
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const list = data?.complaints ?? []
    return status === "all" ? list : list.filter((c) => c.status === status)
  }, [data, status])

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My complaints</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All issues you have reported, with live status updates.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center gap-3">
            <Select value={status} onValueChange={(v) => setStatus(v as ComplaintStatus | "all")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All statuses" : STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{filtered.length} shown</span>
          </div>

          <ComplaintsList
            complaints={filtered}
            isLoading={isLoading}
            onSelect={(c) => {
              setSelected(c)
              setOpen(true)
            }}
          />
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
