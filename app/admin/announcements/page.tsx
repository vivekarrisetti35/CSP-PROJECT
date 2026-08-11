"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Loader2, Megaphone, Send, Bell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { fetcher, apiSend, timeAgo } from "@/lib/client"
import type { Announcement } from "@/lib/types"

export default function AdminAnnouncementsPage() {
  const { data, isLoading, mutate } = useSWR<{ announcements: Announcement[] }>(
    "/api/announcements",
    fetcher,
  )

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState(false)

  const announcements = data?.announcements ?? []

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message body are required.")
      return
    }

    setBusy(true)
    try {
      await apiSend("/api/announcements", "POST", { title, body })
      toast.success("Broadcast announcement sent to all users!")
      setTitle("")
      setBody("")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Broadcast failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Campus Broadcast Announcements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Publish campus-wide announcements and alert notifications to all students, faculty, and staff.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Create Broadcast Form */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="size-5 text-primary" /> New Broadcast
            </CardTitle>
            <CardDescription>
              Sending an announcement automatically notifies all users across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBroadcast} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Headline Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Water maintenance in Block C"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="body">Message Content *</Label>
                <Textarea
                  id="body"
                  placeholder="Provide complete details about schedule, impacted areas..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <Button type="submit" disabled={busy} className="w-full">
                {busy ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                Broadcast Announcement
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Past Announcements History */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Announcement Log</CardTitle>
            <CardDescription>History of broadcasts sent to campus members.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading announcements...
              </div>
            ) : announcements.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No announcements published yet.
              </div>
            ) : (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{a.title}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                  <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                    <Bell className="size-3 text-primary" /> Published by {a.authorName}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
