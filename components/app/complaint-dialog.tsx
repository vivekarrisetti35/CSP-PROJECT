"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, MapPin, Star } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { StatusBadge, PriorityBadge } from "@/components/app/badges"
import { CATEGORY_LABELS, apiSend } from "@/lib/client"
import type { Complaint, ComplaintStatus, Priority, PublicUser } from "@/lib/types"
import { cn } from "@/lib/utils"

type Worker = Pick<PublicUser, "id" | "name">

export function ComplaintDialog({
  complaint,
  viewer,
  workers,
  open,
  onOpenChange,
  onChanged,
}: {
  complaint: Complaint | null
  viewer: PublicUser
  workers?: Worker[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")

  if (!complaint) return null

  const isSubmitter = complaint.submittedById === viewer.id
  const isAssignedWorker = viewer.role === "maintenance" && complaint.assignedToId === viewer.id
  const isAdmin = viewer.role === "admin"

  async function patch(body: Record<string, unknown>, msg: string) {
    setBusy(true)
    try {
      await apiSend(`/api/complaints/${complaint!.id}`, "PATCH", body)
      toast.success(msg)
      onChanged()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    } finally {
      setBusy(false)
    }
  }

  async function submitFeedback() {
    if (rating < 1) {
      toast.error("Please select a rating")
      return
    }
    await patch({ feedback: { rating, comment } }, "Thanks for your feedback")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{complaint.code}</span>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
          <DialogTitle className="text-balance">{complaint.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {complaint.location} · {CATEGORY_LABELS[complaint.category]}
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm leading-relaxed text-foreground/90">{complaint.description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Submitted by</p>
            <p className="font-medium">{complaint.submittedByName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Assigned to</p>
            <p className="font-medium">{complaint.assignedToName ?? "Unassigned"}</p>
          </div>
        </div>

        {complaint.feedback && (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-4",
                    i < complaint.feedback!.rating
                      ? "fill-accent text-accent"
                      : "text-muted-foreground/40",
                  )}
                />
              ))}
            </div>
            {complaint.feedback.comment && (
              <p className="mt-1.5 text-sm text-muted-foreground">{complaint.feedback.comment}</p>
            )}
          </div>
        )}

        {/* Admin: assign + priority */}
        {isAdmin && (
          <>
            <Separator />
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Assign to maintenance</span>
                <Select
                  value={complaint.assignedToId ?? "none"}
                  onValueChange={(v) =>
                    patch({ assignedToId: v === "none" ? null : v }, "Assignment updated")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {(workers ?? []).map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Priority</span>
                <Select
                  value={complaint.priority}
                  onValueChange={(v) => patch({ priority: v as Priority }, "Priority updated")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusButton current={complaint.status} target="in_progress" busy={busy} onClick={patch} />
                <StatusButton current={complaint.status} target="resolved" busy={busy} onClick={patch} />
                <StatusButton current={complaint.status} target="rejected" busy={busy} onClick={patch} />
              </div>
            </div>
          </>
        )}

        {/* Maintenance worker actions */}
        {isAssignedWorker && !isAdmin && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {complaint.status === "assigned" && (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => patch({ status: "in_progress" }, "Marked in progress")}
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Start work
                </Button>
              )}
              {(complaint.status === "assigned" || complaint.status === "in_progress") && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => patch({ status: "resolved" }, "Marked resolved")}
                >
                  Mark resolved
                </Button>
              )}
            </div>
          </>
        )}

        {/* Submitter feedback on resolved complaints */}
        {isSubmitter && complaint.status === "resolved" && !complaint.feedback && (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Rate the resolution</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    className="rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Star
                      className={cn(
                        "size-6 transition-colors",
                        i < rating ? "fill-accent text-accent" : "text-muted-foreground/40",
                      )}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Any comments about the resolution? (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
              <Button size="sm" className="self-start" disabled={busy} onClick={submitFeedback}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                Submit feedback
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function StatusButton({
  current,
  target,
  busy,
  onClick,
}: {
  current: ComplaintStatus
  target: ComplaintStatus
  busy: boolean
  onClick: (body: Record<string, unknown>, msg: string) => void
}) {
  const labels: Record<string, string> = {
    in_progress: "In progress",
    resolved: "Resolved",
    rejected: "Reject",
  }
  return (
    <Button
      size="sm"
      variant={target === "rejected" ? "outline" : current === target ? "default" : "secondary"}
      disabled={busy || current === target}
      onClick={() => onClick({ status: target }, `Status set to ${labels[target]}`)}
    >
      {labels[target]}
    </Button>
  )
}
