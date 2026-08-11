"use client"

import useSWR from "swr"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts"
import { Clock, Star, AlertCircle, CheckCircle2, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/app/stat-card"
import { fetcher, CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/client"

const COLORS = [
  "var(--color-chart-1, #3b82f6)",
  "var(--color-chart-2, #10b981)",
  "var(--color-chart-3, #f59e0b)",
  "var(--color-chart-4, #ef4444)",
  "var(--color-chart-5, #8b5cf6)",
  "#ec4899",
  "#64748b",
]

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useSWR<any>("/api/analytics", fetcher)

  if (isLoading || !data) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    )
  }

  const { totals, byStatus, byCategory, byPriority, trend } = data

  const formattedCategoryData = byCategory.map((item: any) => ({
    name: CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category,
    count: item.count,
  }))

  const formattedStatusData = byStatus.map((item: any) => ({
    name: STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status,
    count: item.count,
  }))

  const formattedPriorityData = byPriority.map((item: any) => ({
    name: PRIORITY_LABELS[item.priority as keyof typeof PRIORITY_LABELS] || item.priority,
    count: item.count,
  }))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics & Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Campus issue reporting trends, status breakdowns, and service resolution metrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Complaints" value={totals.complaints} icon={BarChart3} />
        <StatCard
          label="Avg Resolution Time"
          value={`${totals.avgResolutionHours} hrs`}
          icon={Clock}
          accent="chart-3"
        />
        <StatCard
          label="Avg User Rating"
          value={totals.avgRating ? `${totals.avgRating} / 5` : "N/A"}
          icon={Star}
          accent="chart-2"
        />
        <StatCard
          label="Pending Triage"
          value={totals.pending}
          icon={AlertCircle}
          accent="chart-1"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">7-Day Complaint Trend</CardTitle>
            <CardDescription>Number of new complaints logged per day over the past week.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#888888" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--background)", borderRadius: "8px" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Complaints"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Complaints by Category</CardTitle>
            <CardDescription>Distribution across facility departments.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedCategoryData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} angle={-30} textAnchor="end" />
                <YAxis allowDecimals={false} stroke="#888888" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--background)", borderRadius: "8px" }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Complaints by Status</CardTitle>
            <CardDescription>Current state of all campus reports.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formattedStatusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, value }) =>
                    value && Number(value) > 0 ? `${name}: ${value}` : ""
                  }
                >
                  {formattedStatusData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--background)", borderRadius: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Priority Distribution</CardTitle>
            <CardDescription>Urgency levels of reported issues.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedPriorityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#888888" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--background)", borderRadius: "8px" }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
