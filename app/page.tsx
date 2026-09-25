import Link from "next/link"
import { redirect } from "next/navigation"
import {
  BarChart3,
  Bell,
  PackageSearch,
  ShieldCheck,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { roleHome } from "@/lib/client"

const FEATURES = [
  {
    icon: Wrench,
    title: "Log & track complaints",
    body: "Report a broken AC, leaking tap, or dead WiFi in seconds and watch it move from pending to resolved.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based workflow",
    body: "Students and faculty submit, maintenance staff resolve, and admins assign, prioritize, and oversee.",
  },
  {
    icon: PackageSearch,
    title: "Admin Lost & Found",
    body: "Admin-managed campus lost & found registry with contact details and claim tracking.",
  },
  {
    icon: Bell,
    title: "Live notifications",
    body: "Get pinged the moment your complaint is assigned, updated, or resolved — no refreshing required.",
  },
  {
    icon: BarChart3,
    title: "Admin analytics",
    body: "Category, status, and priority breakdowns plus resolution time and satisfaction ratings at a glance.",
  },
]

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const user = await getCurrentUser()
  if (user) redirect(roleHome(user.role))

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b border-border px-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wrench className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">CRMCRS</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>Sign in</Button>
          <Button nativeButton={false} render={<Link href="/register" />}>Get started</Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-20 text-center md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-chart-2" />
            Campus Resource & Complaint Resolution System
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            Every campus issue, resolved on one platform.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground text-pretty">
            CRMCRS connects students, faculty, maintenance staff, and administrators so complaints get
            reported, routed, and resolved — fast, transparent, and accountable.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" nativeButton={false} render={<Link href="/register" />}>Create an account</Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>Sign in</Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
        CRMCRS — Campus Resource & Complaint Resolution System
      </footer>
    </div>
  )
}
