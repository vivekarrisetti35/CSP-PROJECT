"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { toast } from "sonner"
import { QrCode, Search, Wrench, MapPin, CheckCircle, PlusCircle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetcher } from "@/lib/client"
import type { Resource } from "@/lib/types"

export default function QRScanPage() {
  const { data } = useSWR<{ resources: Resource[] }>("/api/resources", fetcher)
  const resources = data?.resources ?? []

  const [inputCode, setInputCode] = useState("")
  const [activeResource, setActiveResource] = useState<Resource | null>(null)
  const [searching, setSearching] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!inputCode.trim()) return

    setSearching(true)
    try {
      // Direct lookup or match by id/name/location
      const code = inputCode.trim().toLowerCase()
      const match = resources.find(
        (r) =>
          r.id.toLowerCase() === code ||
          r.name.toLowerCase().includes(code) ||
          r.location.toLowerCase().includes(code),
      )

      if (match) {
        setActiveResource(match)
        toast.success(`Asset found: ${match.name}`)
      } else {
        const res = await fetcher<{ resource: Resource }>(`/api/resources/${code}`).catch(() => null)
        if (res?.resource) {
          setActiveResource(res.resource)
          toast.success(`Asset found: ${res.resource.name}`)
        } else {
          toast.error("Resource not found. Try selecting from campus assets below.")
          setActiveResource(null)
        }
      }
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">QR Asset Scanner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan or enter a campus resource QR code to report issues directly for that specific asset.
        </p>
      </div>

      {/* Simulator / Code Lookup Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <QrCode className="size-5 text-primary" /> Scan or enter Asset Code
          </CardTitle>
          <CardDescription>
            Enter a Resource ID (e.g. <code className="rounded bg-muted px-1 py-0.5">res_1</code>) or search by equipment name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Enter Asset ID or Keyword (e.g. res_1, AC Unit, Projector)..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Button type="submit" disabled={searching}>
              {searching ? "Searching..." : "Lookup Asset"}
            </Button>
          </form>

          {activeResource && (
            <div className="mt-6 rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary">
                      {activeResource.id}
                    </span>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {activeResource.type}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold">{activeResource.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4 text-primary" /> {activeResource.location}
                  </p>
                </div>
                <Button size="lg" nativeButton={false} render={<Link href={`/portal/new?resourceId=${activeResource.id}&location=${encodeURIComponent(activeResource.location)}`} />}>
                  <PlusCircle className="mr-2 size-4" /> Report Issue for this Asset
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campus Resources List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registered Campus Resources</CardTitle>
          <CardDescription>
            Click any resource to simulate scanning its physical QR tag.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {resources.map((res) => (
            <div
              key={res.id}
              onClick={() => {
                setInputCode(res.id)
                setActiveResource(res)
              }}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-muted-foreground">{res.id}</span>
                  <span className="text-xs text-muted-foreground">{res.type}</span>
                </div>
                <p className="mt-1 truncate font-medium">{res.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {res.location}
                </p>
              </div>
              <Button size="icon" variant="ghost">
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
