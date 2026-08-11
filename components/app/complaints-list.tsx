"use client"

import { StatusBadge, PriorityBadge } from "@/components/app/badges"
import { Skeleton } from "@/components/ui/skeleton"
import { CATEGORY_LABELS, timeAgo } from "@/lib/client"
import { MapPin } from "lucide-react"
import type { Complaint } from "@/lib/types"

export function ComplaintsList({
  complaints,
  isLoading,
  emptyLabel = "No complaints match your filters.",
  onSelect,
  showAssignee,
}: {
  complaints: Complaint[]
  isLoading?: boolean
  emptyLabel?: string
  onSelect: (c: Complaint) => void
  showAssignee?: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (complaints.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {complaints.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c)}
          className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">{c.code}</span>
              <StatusBadge status={c.status} />
              <PriorityBadge priority={c.priority} />
            </div>
            <p className="mt-1.5 truncate text-sm font-medium">{c.title}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" /> {c.location} · {CATEGORY_LABELS[c.category]} ·{" "}
              {timeAgo(c.createdAt)}
            </p>
          </div>
          {showAssignee && (
            <div className="shrink-0 text-right text-xs text-muted-foreground">
              <p className="text-[11px] uppercase tracking-wide">Assigned</p>
              <p className="font-medium text-foreground">{c.assignedToName ?? "—"}</p>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
