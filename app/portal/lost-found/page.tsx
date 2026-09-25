"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/client"
import { LostFoundView } from "@/components/app/lost-found-view"
import type { PublicUser } from "@/lib/types"

export default function PortalLostFoundPage() {
  const { data: me, isLoading } = useSWR<{ user: PublicUser }>("/api/auth/me", fetcher)

  if (isLoading || !me?.user) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading Lost & Found...</div>
  }

  return <LostFoundView user={me.user} />
}
