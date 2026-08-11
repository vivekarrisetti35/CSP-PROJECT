"use client"

import { useState } from "react"
import useSWR from "swr"
import QRCode from "qrcode"
import { toast } from "sonner"
import { Boxes, Download, Loader2, MapPin, PlusCircle, QrCode, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { fetcher, apiSend } from "@/lib/client"
import type { Resource } from "@/lib/types"

export default function AdminResourcesPage() {
  const { data, isLoading, mutate } = useSWR<{ resources: Resource[] }>("/api/resources", fetcher)

  const [openAddModal, setOpenAddModal] = useState(false)
  const [openQrModal, setOpenQrModal] = useState(false)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [type, setType] = useState("Air Conditioner")
  const [location, setLocation] = useState("")

  const resources = data?.resources ?? []

  async function handleAddResource(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !type.trim() || !location.trim()) {
      toast.error("All fields are required.")
      return
    }

    setBusy(true)
    try {
      await apiSend("/api/resources", "POST", { name, type, location })
      toast.success(`Resource ${name} added successfully!`)
      setOpenAddModal(false)
      setName("")
      setLocation("")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add resource")
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteResource(r: Resource) {
    if (!confirm(`Are you sure you want to delete ${r.name}?`)) return
    try {
      await apiSend(`/api/resources/${r.id}`, "DELETE")
      toast.success(`Resource ${r.name} deleted`)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  async function handleGenerateQr(r: Resource) {
    setSelectedResource(r)
    try {
      const url = `${window.location.origin}/portal/resources/${r.id}`
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 })
      setQrDataUrl(dataUrl)
      setOpenQrModal(true)
    } catch (err) {
      toast.error("Failed to generate QR code")
    }
  }

  function downloadQr() {
    if (!qrDataUrl || !selectedResource) return
    const a = document.createElement("a")
    a.href = qrDataUrl
    a.download = `QR_${selectedResource.id}_${selectedResource.name.replace(/\s+/g, "_")}.png`
    a.click()
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campus Resource Registry & QR Codes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register equipment, physical locations, and generate printable QR codes for quick issue reporting.
          </p>
        </div>
        <Button onClick={() => setOpenAddModal(true)}>
          <PlusCircle className="mr-2 size-4" /> Add Resource
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading resources...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset ID</TableHead>
                  <TableHead>Resource Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs font-bold text-primary">{r.id}</TableCell>
                    <TableCell className="font-medium text-foreground">{r.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" /> {r.location}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateQr(r)}
                        >
                          <QrCode className="mr-1.5 size-4" /> QR Code
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteResource(r)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Resource Modal */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Campus Resource</DialogTitle>
            <DialogDescription>
              Register new equipment or room facility to enable QR code reporting.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddResource} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Resource Name *</Label>
              <Input
                id="name"
                placeholder="e.g. AC Unit - LH102, Main Gate Elevator"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Equipment / Resource Type *</Label>
              <Input
                id="type"
                placeholder="e.g. Air Conditioner, Projector, Elevator, Water Cooler"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Campus Location *</Label>
              <Input
                id="location"
                placeholder="e.g. Lecture Hall 102, Library Ground Floor"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Add Resource
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Display & Download Modal */}
      <Dialog open={openQrModal} onOpenChange={setOpenQrModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Printable QR Code</DialogTitle>
            <DialogDescription>
              Attach this QR code to {selectedResource?.name} at {selectedResource?.location}.
            </DialogDescription>
          </DialogHeader>

          {selectedResource && qrDataUrl && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt={`QR Code for ${selectedResource.name}`} className="size-56" />
              </div>
              <div>
                <p className="font-mono text-sm font-semibold text-primary">{selectedResource.id}</p>
                <h4 className="font-medium">{selectedResource.name}</h4>
                <p className="text-xs text-muted-foreground">{selectedResource.location}</p>
              </div>

              <div className="flex w-full justify-center gap-3 pt-2">
                <Button onClick={downloadQr} className="w-full">
                  <Download className="mr-2 size-4" /> Download QR Image
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
