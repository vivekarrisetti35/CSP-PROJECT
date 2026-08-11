"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ArrowLeft, MapPin, PlusCircle, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { fetcher, timeAgo, CATEGORY_LABELS } from "@/lib/client"
import { StatusBadge, PriorityBadge } from "@/components/app/badges"
import type { Complaint, Resource } from "@/lib/types"

export default function ResourceLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: resData, isLoading: resLoading } = useSWR<{ resource: Resource }>(
    `/api/resources/${id}`,
    fetcher,
  )
  const { data: compData } = useSWR<{ complaints: Complaint[] }>("/api/complaints", fetcher)

  const resource = resData?.resource
  const relatedComplaints = (compData?.complaints ?? []).filter((c) => c.resourceId === id)

  if (resLoading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="mx-auto max-w-3xl p-12 text-center">
        <AlertTriangle className="mx-auto size-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Campus Resource Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested QR code or resource ID ({id}) does not match any registered asset.
        </p>
        <Button nativeButton={false} render={<Link href="/portal" />} className="mt-6">Back to portal</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-8">
      <Button variant="ghost" size="sm" className="-ml-2 self-start text-muted-foreground" nativeButton={false} render={<Link href="/portal" />}>
        <ArrowLeft className="mr-1 size-4" /> Back to portal
      </Button>

      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary">{resource.id}</span>
            <Badge variant="outline">{resource.type}</Badge>
          </div>
          <CardTitle className="mt-1 text-2xl">{resource.name}</CardTitle>
          <CardDescription className="flex items-center gap-1.5 text-base">
            <MapPin className="size-4 text-primary" /> {resource.location}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            If this equipment is faulty, damaged, or requires maintenance, click below to log a priority complaint.
          </p>
          <Button size="lg" className="w-full sm:w-auto" nativeButton={false} render={<Link href={`/portal/new?resourceId=${resource.id}&location=${encodeURIComponent(resource.location)}`} />}>
            <PlusCircle className="mr-2 size-5" /> Report Issue for {resource.name}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Complaints for this Asset</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {relatedComplaints.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No recent issues logged for this resource.
            </p>
          ) : (
            relatedComplaints.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</p>
                </div>
                <PriorityBadge priority={c.priority} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
