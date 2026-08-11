"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ComplaintsList } from "@/components/app/complaints-list"
import { ComplaintDialog } from "@/components/app/complaint-dialog"
import { fetcher, STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS } from "@/lib/client"
import type { Complaint, ComplaintCategory, ComplaintStatus, Priority, PublicUser } from "@/lib/types"

export default function AdminComplaintsPage() {
  const { data: me } = useSWR<{ user: PublicUser }>("/api/auth/me", fetcher)
  const { data: complaintsData, isLoading, mutate } = useSWR<{ complaints: Complaint[] }>(
    "/api/complaints",
    fetcher,
  )
  const { data: workersData } = useSWR<{ users: PublicUser[] }>(
    "/api/users?role=maintenance",
    fetcher,
  )

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<ComplaintStatus | "all">("all")
  const [category, setCategory] = useState<ComplaintCategory | "all">("all")
  const [priority, setPriority] = useState<Priority | "all">("all")

  const [selected, setSelected] = useState<Complaint | null>(null)
  const [openDialog, setOpenDialog] = useState(false)

  const complaints = complaintsData?.complaints ?? []
  const workers = workersData?.users ?? []

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (status !== "all" && c.status !== status) return false
      if (category !== "all" && c.category !== category) return false
      if (priority !== "all" && c.priority !== priority) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          c.code.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.submittedByName.toLowerCase().includes(q) ||
          (c.assignedToName && c.assignedToName.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [complaints, status, category, priority, search])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Campus Complaints Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Filter, assign, prioritize, and manage all issues submitted across campus.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Search title, code, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.keys(STATUS_LABELS).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s as ComplaintStatus]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {Object.keys(CATEGORY_LABELS).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c as ComplaintCategory]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {Object.keys(PRIORITY_LABELS).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORITY_LABELS[p as Priority]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filtered.length} of {complaints.length} total complaints</span>
          </div>

          <ComplaintsList
            complaints={filtered}
            isLoading={isLoading}
            showAssignee
            emptyLabel="No complaints found matching your filters."
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
          workers={workers}
          open={openDialog}
          onOpenChange={setOpenDialog}
          onChanged={mutate}
        />
      )}
    </div>
  )
}
