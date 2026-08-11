import { cn } from "@/lib/utils"
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/client"
import type { ComplaintStatus, Priority } from "@/lib/types"

const STATUS_STYLES: Record<ComplaintStatus, string> = {
  pending: "bg-muted text-muted-foreground ring-border",
  assigned: "bg-chart-4/15 text-chart-4 ring-chart-4/30",
  in_progress: "bg-primary/15 text-primary ring-primary/30",
  resolved: "bg-chart-2/15 text-chart-2 ring-chart-2/30",
  rejected: "bg-destructive/15 text-destructive ring-destructive/30",
}

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground ring-border",
  medium: "bg-chart-2/15 text-chart-2 ring-chart-2/30",
  high: "bg-accent/25 text-accent-foreground ring-accent/40",
  urgent: "bg-destructive/15 text-destructive ring-destructive/30",
}

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return <Pill className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Pill>
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Pill className={PRIORITY_STYLES[priority]}>
      {priority === "urgent" || priority === "high" ? "↑ " : ""}
      {PRIORITY_LABELS[priority]}
    </Pill>
  )
}
