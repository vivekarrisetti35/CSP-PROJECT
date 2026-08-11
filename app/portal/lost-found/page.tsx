"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Loader2, MapPin, PackageSearch, PlusCircle, User, Phone, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetcher, apiSend, timeAgo } from "@/lib/client"
import type { LostFoundItem, PublicUser } from "@/lib/types"

export default function LostFoundPage() {
  const { data: me } = useSWR<{ user: PublicUser }>("/api/auth/me", fetcher)
  const { data, isLoading, mutate } = useSWR<{ items: LostFoundItem[] }>(
    "/api/lost-found",
    fetcher,
  )

  const [tab, setTab] = useState<"all" | "lost" | "found">("all")
  const [openModal, setOpenModal] = useState(false)
  const [busy, setBusy] = useState(false)

  // Form state
  const [type, setType] = useState<"lost" | "found">("lost")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("Electronics")
  const [contact, setContact] = useState("")

  const items = data?.items ?? []
  const filtered = items.filter((i) => (tab === "all" ? true : i.type === tab))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !location.trim()) {
      toast.error("Title and location are required.")
      return
    }

    setBusy(true)
    try {
      await apiSend("/api/lost-found", "POST", {
        type,
        title,
        description,
        location,
        category,
        contact: contact || me?.user.email,
      })
      toast.success(`Successfully posted ${type} item!`)
      setOpenModal(false)
      setTitle("")
      setDescription("")
      setLocation("")
      setContact("")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post item")
    } finally {
      setBusy(false)
    }
  }

  async function toggleStatus(item: LostFoundItem) {
    const nextStatus = item.status === "open" ? (item.type === "lost" ? "claimed" : "returned") : "open"
    try {
      await apiSend(`/api/lost-found/${item.id}`, "PATCH", { status: nextStatus })
      toast.success(`Item marked as ${nextStatus}`)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campus Lost & Found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Report items you have lost or found across campus buildings.
          </p>
        </div>
        <Button onClick={() => setOpenModal(true)}>
          <PlusCircle className="mr-2 size-4" /> Post item
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All items ({items.length})</TabsTrigger>
            <TabsTrigger value="lost">
              Lost ({items.filter((i) => i.type === "lost").length})
            </TabsTrigger>
            <TabsTrigger value="found">
              Found ({items.filter((i) => i.type === "found").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32 p-6" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <PackageSearch className="mx-auto size-10 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No items listed</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No items matching your criteria have been reported yet.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((item) => {
            const isOwner = me?.user.id === item.reportedById || me?.user.role === "admin"
            return (
              <Card key={item.id} className="flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={item.type === "lost" ? "destructive" : "default"}>
                      {item.type.toUpperCase()}
                    </Badge>
                    <Badge variant={item.status === "open" ? "outline" : "secondary"}>
                      {item.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-base">{item.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {item.location} · {item.category}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    {item.description || "No additional description provided."}
                  </p>
                  <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <User className="size-3.5" /> {item.reportedByName}
                      </span>
                      <span>{timeAgo(item.createdAt)}</span>
                    </div>
                    {item.contact && (
                      <div className="flex items-center gap-1 font-mono text-muted-foreground">
                        <Phone className="size-3.5" /> {item.contact}
                      </div>
                    )}
                  </div>

                  {isOwner && (
                    <Button
                      size="sm"
                      variant={item.status === "open" ? "outline" : "ghost"}
                      onClick={() => toggleStatus(item)}
                      className="mt-1 w-full"
                    >
                      <CheckCircle2 className="mr-2 size-4" />
                      Mark as {item.status === "open" ? (item.type === "lost" ? "Claimed" : "Returned") : "Open"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Post Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Post to Lost & Found</DialogTitle>
            <DialogDescription>
              Provide item details so students and staff can identify or return it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={type} onValueChange={(v) => setType(v as "lost" | "found")}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">I lost something</SelectItem>
                    <SelectItem value="found">I found something</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Bag">Bag / Backpack</SelectItem>
                    <SelectItem value="Personal Item">Personal Item</SelectItem>
                    <SelectItem value="Documents/ID">Documents / ID</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Item Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Blue Hydro Flask bottle, Silver MacBook Pro"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Campus Location *</Label>
              <Input
                id="location"
                placeholder="e.g. Cafeteria, Library 2nd floor, LH101"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact">Contact Information</Label>
              <Input
                id="contact"
                placeholder="Email or Phone Number"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Distinctive marks, stickers, color, time lost/found..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Post
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
