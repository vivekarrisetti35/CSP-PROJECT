"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Handshake,
  ImageIcon,
  Loader2,
  MapPin,
  PackageSearch,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  User,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { ClaimRequest, LostFoundItem, PublicUser } from "@/lib/types"

const CATEGORIES = [
  "Electronics",
  "Bag / Backpack",
  "Personal Item",
  "Documents / ID",
  "Clothing",
  "Keys",
  "Other",
]

export function LostFoundView({ user }: { user: PublicUser }) {
  const { data, isLoading, mutate } = useSWR<{ items: LostFoundItem[] }>(
    "/api/lost-found",
    fetcher,
  )

  // Filters & Search
  const [tab, setTab] = useState<"all" | "lost" | "found">("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Modals
  const [openReportModal, setOpenReportModal] = useState(false)
  const [openClaimModal, setOpenClaimModal] = useState<LostFoundItem | null>(null)
  const [openManageClaimsModal, setOpenManageClaimsModal] = useState<LostFoundItem | null>(null)
  const [busy, setBusy] = useState(false)

  // Report Form State
  const [reportType, setReportType] = useState<"lost" | "found">("lost")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("Electronics")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [imageUrl, setImageUrl] = useState("")
  const [contact, setContact] = useState(user.email)

  // Claim Form State
  const [proofDetails, setProofDetails] = useState("")
  const [claimContact, setClaimContact] = useState(user.email)

  const items = data?.items ?? []

  // Filter items locally
  const filteredItems = items.filter((item) => {
    if (tab !== "all" && item.type !== tab) return false
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false
    if (selectedStatus !== "all" && item.status !== selectedStatus) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchDesc = item.description.toLowerCase().includes(q)
      const matchLoc = item.location.toLowerCase().includes(q)
      const matchCategory = item.category.toLowerCase().includes(q)
      if (!matchTitle && !matchDesc && !matchLoc && !matchCategory) return false
    }
    return true
  })

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !location.trim()) {
      toast.error("Title and location are required.")
      return
    }

    setBusy(true)
    try {
      await apiSend("/api/lost-found", "POST", {
        type: reportType,
        title,
        description,
        location,
        category,
        date,
        imageUrl: imageUrl.trim() || null,
        contact: contact.trim() || user.email,
      })
      toast.success(`Successfully reported ${reportType} item!`)
      setOpenReportModal(false)
      setTitle("")
      setDescription("")
      setLocation("")
      setImageUrl("")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post item")
    } finally {
      setBusy(false)
    }
  }

  async function handleClaimSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!openClaimModal) return
    if (!proofDetails.trim()) {
      toast.error("Please describe proof of ownership.")
      return
    }

    setBusy(true)
    try {
      await apiSend(`/api/lost-found/${openClaimModal.id}/claim`, "POST", {
        proofDetails,
        contact: claimContact.trim() || user.email,
      })
      toast.success("Claim request submitted successfully! Item owner notified.")
      setOpenClaimModal(null)
      setProofDetails("")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Claim submission failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleReviewClaim(item: LostFoundItem, claimId: string, newStatus: "approved" | "rejected") {
    try {
      await apiSend(`/api/lost-found/${item.id}/claim/${claimId}`, "PATCH", { status: newStatus })
      toast.success(`Claim request ${newStatus}`)
      mutate()
      // Refresh modal item state if open
      if (openManageClaimsModal?.id === item.id) {
        const updatedItem = items.find((i) => i.id === item.id)
        if (updatedItem) setOpenManageClaimsModal(updatedItem)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed")
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

  async function handleDelete(item: LostFoundItem) {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return
    try {
      await apiSend(`/api/lost-found/${item.id}`, "DELETE")
      toast.success("Item deleted")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campus Lost & Found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Report lost items, list found objects, and submit claim requests with proof of ownership.
          </p>
        </div>
        <Button onClick={() => setOpenReportModal(true)}>
          <PlusCircle className="mr-2 size-4" /> Report Lost / Found Item
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Type Tabs */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All ({items.length})</TabsTrigger>
              <TabsTrigger value="lost">Lost ({items.filter((i) => i.type === "lost").length})</TabsTrigger>
              <TabsTrigger value="found">Found ({items.filter((i) => i.type === "found").length})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search items, locations..."
                className="pl-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Select */}
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v || "all")}>
              <SelectTrigger className="w-36 text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Select */}
            <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v || "all")}>
              <SelectTrigger className="w-32 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="claimed">Claimed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Grid of Items */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-44 p-6" />
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <PackageSearch className="mx-auto size-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold text-foreground">No items match your criteria</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search query, type, or filters.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const isReporter = item.reportedById === user.id
            const isAdmin = user.role === "admin"
            const canManage = isReporter || isAdmin
            const pendingClaimsCount = item.claims?.filter((c) => c.status === "pending").length ?? 0

            return (
              <Card key={item.id} className="flex flex-col justify-between overflow-hidden">
                <div>
                  {item.imageUrl && (
                    <div className="relative h-40 w-full overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = "none"
                        }}
                      />
                    </div>
                  )}

                  <CardHeader className="pb-3 pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={item.type === "lost" ? "destructive" : "default"}>
                        {item.type.toUpperCase()}
                      </Badge>
                      <Badge variant={item.status === "open" ? "outline" : "secondary"}>
                        {item.status}
                      </Badge>
                    </div>

                    <CardTitle className="mt-2 text-base font-semibold text-foreground">
                      {item.title}
                    </CardTitle>

                    <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5 text-muted-foreground" /> {item.location}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Tag className="size-3.5 text-muted-foreground" /> {item.category}
                      </span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {item.description || "No additional description provided."}
                    </p>

                    <div className="flex flex-col gap-1.5 rounded-lg bg-muted/40 p-3 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <User className="size-3.5" /> {item.reportedByName}
                          {isReporter && <span className="text-[10px] text-primary">(You)</span>}
                        </span>
                        <span>{timeAgo(item.createdAt)}</span>
                      </div>
                      {item.date && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="size-3.5" /> Date: {item.date}
                        </div>
                      )}
                      {item.contact && (
                        <div className="flex items-center gap-1 font-mono text-muted-foreground">
                          <Phone className="size-3.5" /> {item.contact}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 pt-0 flex flex-col gap-2">
                  {/* Claim Button for Found Items */}
                  {item.type === "found" && item.status === "open" && !isReporter && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setOpenClaimModal(item)
                        setClaimContact(user.email)
                      }}
                    >
                      <Handshake className="mr-1.5 size-4" /> Claim Item
                    </Button>
                  )}

                  {/* Claims Manager for Item Reporter or Admin */}
                  {canManage && item.claims && item.claims.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setOpenManageClaimsModal(item)}
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="size-4 text-primary" /> Review Claims ({item.claims.length})
                      </span>
                      {pendingClaimsCount > 0 && (
                        <Badge variant="destructive" className="size-5 rounded-full p-0 justify-center text-[10px]">
                          {pendingClaimsCount}
                        </Badge>
                      )}
                    </Button>
                  )}

                  {/* Status Toggle & Delete Actions */}
                  {canManage && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant={item.status === "open" ? "outline" : "ghost"}
                        onClick={() => toggleStatus(item)}
                        className="flex-1 text-xs"
                      >
                        <CheckCircle2 className="mr-1.5 size-3.5" />
                        Mark as {item.status === "open" ? (item.type === "lost" ? "Claimed" : "Returned") : "Open"}
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Report Modal */}
      <Dialog open={openReportModal} onOpenChange={setOpenReportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Lost or Found Item</DialogTitle>
            <DialogDescription>
              List an item you have lost or found on campus to notify the community.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="reportType">Type *</Label>
                <Select
                  value={reportType}
                  onValueChange={(v) => setReportType(v as "lost" | "found")}
                >
                  <SelectTrigger id="reportType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">Lost Item</SelectItem>
                    <SelectItem value="found">Found Item</SelectItem>
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
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Item Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Blue Hydro Flask bottle, Silver MacBook Pro 14"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g. Cafeteria, Library 2nd Fl"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Date Lost / Found</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact">Contact Information</Label>
              <Input
                id="contact"
                placeholder="Email or phone number"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="imageUrl">Photo / Image URL (optional)</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/item-photo.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Distinctive features, stickers, brand name, color, unique marks..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenReportModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Post Report
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Claim Request Modal */}
      {openClaimModal && (
        <Dialog open={!!openClaimModal} onOpenChange={() => setOpenClaimModal(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Claim Request</DialogTitle>
              <DialogDescription>
                Provide proof of ownership for &quot;{openClaimModal.title}&quot; to request return from the finder.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleClaimSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="proofDetails">Proof of Ownership / Distinctive Details *</Label>
                <Textarea
                  id="proofDetails"
                  placeholder="Describe secret marks, wallpaper/serial numbers, specific contents inside, or exact location lost..."
                  value={proofDetails}
                  onChange={(e) => setProofDetails(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="claimContact">Your Contact Information *</Label>
                <Input
                  id="claimContact"
                  placeholder="Email or phone number"
                  value={claimContact}
                  onChange={(e) => setClaimContact(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpenClaimModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Submit Claim
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Manage Claims Modal */}
      {openManageClaimsModal && (
        <Dialog
          open={!!openManageClaimsModal}
          onOpenChange={() => setOpenManageClaimsModal(null)}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Claim Requests for &quot;{openManageClaimsModal.title}&quot;</DialogTitle>
              <DialogDescription>
                Review submitted proof of ownership to approve or reject claims.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pt-2">
              {openManageClaimsModal.claims && openManageClaimsModal.claims.length > 0 ? (
                openManageClaimsModal.claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <User className="size-4 text-primary" /> {claim.claimedByName}
                      </span>
                      <Badge
                        variant={
                          claim.status === "approved"
                            ? "default"
                            : claim.status === "rejected"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {claim.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Phone className="size-3.5" /> {claim.claimedByContact} · {timeAgo(claim.createdAt)}
                    </div>

                    <div className="mt-1 rounded bg-muted/50 p-2.5 text-xs text-foreground">
                      <p className="font-medium text-muted-foreground mb-1">Proof Details:</p>
                      {claim.proofDetails}
                    </div>

                    {claim.status === "pending" && (
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            handleReviewClaim(openManageClaimsModal, claim.id, "rejected")
                          }
                        >
                          <XCircle className="mr-1 size-3.5" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleReviewClaim(openManageClaimsModal, claim.id, "approved")
                          }
                        >
                          <CheckCircle2 className="mr-1 size-3.5" /> Approve & Mark Claimed
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No claim requests submitted yet.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
