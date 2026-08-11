import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "primary",
}: {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  accent?: "primary" | "chart-1" | "chart-2" | "chart-3" | "chart-5" | "destructive"
}) {
  const accentMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    "chart-1": "bg-chart-1/15 text-chart-1",
    "chart-2": "bg-chart-2/15 text-chart-2",
    "chart-3": "bg-accent/25 text-accent-foreground",
    "chart-5": "bg-chart-5/15 text-chart-5",
    destructive: "bg-destructive/10 text-destructive",
  }
  return (
    <Card className="flex flex-row items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", accentMap[accent])}>
        <Icon className="size-5" />
      </div>
    </Card>
  )
}
