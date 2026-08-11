"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Send } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiSend, fetcher, CATEGORY_LABELS, PRIORITY_LABELS } from "@/lib/client"
import type { ComplaintCategory, Priority, Resource } from "@/lib/types"

function NewComplaintForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledResourceId = searchParams.get("resourceId") ?? ""
  const prefilledLocation = searchParams.get("location") ?? ""

  const { data: resData } = useSWR<{ resources: Resource[] }>("/api/resources", fetcher)
  const resources = resData?.resources ?? []

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<ComplaintCategory>("electrical")
  const [priority, setPriority] = useState<Priority>("medium")
  const [location, setLocation] = useState(prefilledLocation)
  const [resourceId, setResourceId] = useState(prefilledResourceId)
  const [busy, setBusy] = useState(false)

  // Auto-fill location if resource changes
  useEffect(() => {
    if (resourceId) {
      const res = resources.find((r) => r.id === resourceId)
      if (res) {
        setLocation(res.location)
      }
    }
  }, [resourceId, resources])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !location.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    setBusy(true)
    try {
      await apiSend("/api/complaints", "POST", {
        title,
        description,
        category,
        priority,
        location,
        resourceId: resourceId || null,
      })
      toast.success("Complaint logged successfully!")
      router.push("/portal/complaints")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log complaint")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl flex-col gap-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-1 text-muted-foreground" nativeButton={false} render={<Link href="/portal" />}>
            <ArrowLeft className="mr-1 size-4" /> Back to overview
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Report a new issue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit a maintenance request or issue for campus facilities.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Complaint details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Issue title *</Label>
              <Input
                id="title"
                placeholder="e.g. AC not cooling, Leaking tap, WiFi down"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as ComplaintCategory)}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as ComplaintCategory[]).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="resource">Campus asset / resource (optional)</Label>
              <Select
                value={resourceId || "none"}
                onValueChange={(v) => setResourceId(!v || v === "none" ? "" : v)}
              >
                <SelectTrigger id="resource">
                  <SelectValue placeholder="Select specific equipment / resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None / General facility</SelectItem>
                  {resources.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g. Lecture Hall 101, Hostel Block C Floor 3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Detailed description *</Label>
              <Textarea
                id="description"
                placeholder="Please describe the issue in detail (when it started, error symptoms, specific room or seat)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="outline" nativeButton={false} render={<Link href="/portal" />}>Cancel</Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                Submit complaint
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewComplaintPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <NewComplaintForm />
    </Suspense>
  )
}
