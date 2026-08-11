"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Loader2, PlusCircle, Trash2, UserCheck, Shield, Wrench, GraduationCap, School } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetcher, apiSend, ROLE_LABELS, timeAgo } from "@/lib/client"
import type { PublicUser, Role } from "@/lib/types"

export default function AdminUsersPage() {
  const { data: me } = useSWR<{ user: PublicUser }>("/api/auth/me", fetcher)
  const { data, isLoading, mutate } = useSWR<{ users: PublicUser[] }>("/api/users", fetcher)

  const [roleFilter, setRoleFilter] = useState<Role | "all">("all")
  const [openModal, setOpenModal] = useState(false)
  const [busy, setBusy] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("maintenance")
  const [department, setDepartment] = useState("Facilities")

  const users = data?.users ?? []
  const filtered = users.filter((u) => (roleFilter === "all" ? true : u.role === roleFilter))

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    setBusy(true)
    try {
      await apiSend("/api/auth/register", "POST", {
        name,
        email,
        password,
        role,
        department: department || null,
      })
      toast.success(`Account created for ${name} (${ROLE_LABELS[role]})`)
      setOpenModal(false)
      setName("")
      setEmail("")
      setPassword("")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(u: PublicUser) {
    if (u.id === me?.user.id) {
      toast.error("You cannot delete your own account.")
      return
    }
    if (!confirm(`Are you sure you want to delete user ${u.name}?`)) return

    try {
      await apiSend(`/api/users/${u.id}`, "DELETE")
      toast.success(`User ${u.name} removed`)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  const roleIcon = (r: Role) => {
    switch (r) {
      case "admin":
        return <Shield className="size-3.5 text-chart-4" />
      case "maintenance":
        return <Wrench className="size-3.5 text-chart-3" />
      case "faculty":
        return <School className="size-3.5 text-chart-2" />
      default:
        return <GraduationCap className="size-3.5 text-chart-1" />
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage students, faculty, maintenance technicians, and system administrators.
          </p>
        </div>
        <Button onClick={() => setOpenModal(true)}>
          <PlusCircle className="mr-2 size-4" /> Add User / Staff
        </Button>
      </div>

      <Tabs value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)} className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
          <TabsTrigger value="student">
            Students ({users.filter((u) => u.role === "student").length})
          </TabsTrigger>
          <TabsTrigger value="faculty">
            Faculty ({users.filter((u) => u.role === "faculty").length})
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            Maintenance ({users.filter((u) => u.role === "maintenance").length})
          </TabsTrigger>
          <TabsTrigger value="admin">
            Admins ({users.filter((u) => u.role === "admin").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department / Hostel</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{u.name}</span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1.5 font-normal">
                        {roleIcon(u.role)}
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.department || u.hostel || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {timeAgo(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.id !== me?.user.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(u)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User / Staff</DialogTitle>
            <DialogDescription>Create a new account with role-based permissions.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. alex@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Temporary Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g. Facilities, CS, Admin"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Create Account
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
