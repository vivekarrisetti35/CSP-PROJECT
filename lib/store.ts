import type {
  Announcement,
  Complaint,
  LostFoundItem,
  Notification,
  Resource,
  User,
} from "./types"

interface DB {
  users: User[]
  resources: Resource[]
  complaints: Complaint[]
  lostFound: LostFoundItem[]
  notifications: Notification[]
  announcements: Announcement[]
  sessions: Map<string, string> // sessionId -> userId
  seq: number
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function seed(): DB {
  const users: User[] = [
    {
      id: "u_admin",
      name: "Ava Admin",
      email: "admin@campus.edu",
      password: "vivek@2006",
      role: "admin",
      department: "Administration",
      hostel: null,
      createdAt: daysAgo(120),
    },
    {
      id: "u_maint1",
      name: "Marco Fields",
      email: "maintenance@campus.edu",
      password: "vivek@2006",
      role: "maintenance",
      department: "Facilities",
      hostel: null,
      createdAt: daysAgo(110),
    },
    {
      id: "u_maint2",
      name: "Nadia Rivers",
      email: "nadia@campus.edu",
      password: "vivek@2006",
      role: "maintenance",
      department: "Facilities",
      hostel: null,
      createdAt: daysAgo(90),
    },
    {
      id: "u_student",
      name: "Sam Student",
      email: "student@campus.edu",
      password: "vivek@2006",
      role: "student",
      department: "Computer Science",
      hostel: "Block C",
      createdAt: daysAgo(60),
    },
    {
      id: "u_faculty",
      name: "Dr. Farah Lee",
      email: "faculty@campus.edu",
      password: "vivek@2006",
      role: "faculty",
      department: "Physics",
      hostel: null,
      createdAt: daysAgo(80),
    },
  ]

  const resources: Resource[] = [
    { id: "res_1", name: "AC Unit - LH101", type: "Air Conditioner", location: "Lecture Hall 101", createdAt: daysAgo(200) },
    { id: "res_2", name: "Projector - LH101", type: "Projector", location: "Lecture Hall 101", createdAt: daysAgo(200) },
    { id: "res_3", name: "Water Cooler - Block C", type: "Water Cooler", location: "Block C, Ground Floor", createdAt: daysAgo(200) },
    { id: "res_4", name: "Elevator - Library", type: "Elevator", location: "Central Library", createdAt: daysAgo(200) },
    { id: "res_5", name: "WiFi AP - Hostel C3", type: "Network", location: "Block C, 3rd Floor", createdAt: daysAgo(200) },
  ]

  const complaints: Complaint[] = [
    {
      id: "c_1",
      code: "CMP-1001",
      title: "AC not cooling in LH101",
      description: "The air conditioner runs but does not cool the room during afternoon lectures.",
      category: "electrical",
      priority: "high",
      location: "Lecture Hall 101",
      resourceId: "res_1",
      status: "assigned",
      submittedById: "u_faculty",
      submittedByName: "Dr. Farah Lee",
      assignedToId: "u_maint1",
      assignedToName: "Marco Fields",
      feedback: null,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(2),
    },
    {
      id: "c_2",
      code: "CMP-1002",
      title: "Leaking tap in Block C washroom",
      description: "Continuous water leak from the second tap. Wasting water.",
      category: "plumbing",
      priority: "medium",
      location: "Block C, Ground Floor",
      resourceId: null,
      status: "in_progress",
      submittedById: "u_student",
      submittedByName: "Sam Student",
      assignedToId: "u_maint2",
      assignedToName: "Nadia Rivers",
      feedback: null,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    },
    {
      id: "c_3",
      code: "CMP-1003",
      title: "WiFi down on 3rd floor",
      description: "No internet connectivity in hostel Block C 3rd floor since morning.",
      category: "network",
      priority: "urgent",
      location: "Block C, 3rd Floor",
      resourceId: "res_5",
      status: "resolved",
      submittedById: "u_student",
      submittedByName: "Sam Student",
      assignedToId: "u_maint1",
      assignedToName: "Marco Fields",
      feedback: { rating: 5, comment: "Fixed within hours, great job!", createdAt: daysAgo(1) },
      createdAt: daysAgo(8),
      updatedAt: daysAgo(6),
    },
    {
      id: "c_4",
      code: "CMP-1004",
      title: "Broken chair in Library",
      description: "A reading chair near the reference section is broken and unsafe.",
      category: "furniture",
      priority: "low",
      location: "Central Library",
      resourceId: null,
      status: "pending",
      submittedById: "u_faculty",
      submittedByName: "Dr. Farah Lee",
      assignedToId: null,
      assignedToName: null,
      feedback: null,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: "c_5",
      code: "CMP-1005",
      title: "Elevator stuck intermittently",
      description: "Library elevator halts between floors occasionally.",
      category: "civil",
      priority: "high",
      location: "Central Library",
      resourceId: "res_4",
      status: "resolved",
      submittedById: "u_student",
      submittedByName: "Sam Student",
      assignedToId: "u_maint2",
      assignedToName: "Nadia Rivers",
      feedback: { rating: 4, comment: "Working now, thanks.", createdAt: daysAgo(9) },
      createdAt: daysAgo(14),
      updatedAt: daysAgo(10),
    },
  ]

  const lostFound: LostFoundItem[] = [
    {
      id: "lf_1",
      type: "lost",
      title: "Black backpack",
      description: "Lost near the cafeteria, contains a laptop charger.",
      location: "Cafeteria",
      category: "Bag",
      status: "open",
      reportedById: "u_student",
      reportedByName: "Sam Student",
      contact: "student@campus.edu",
      createdAt: daysAgo(2),
    },
    {
      id: "lf_2",
      type: "found",
      title: "Blue water bottle",
      description: "Found in Lecture Hall 101 after class.",
      location: "Lecture Hall 101",
      category: "Personal Item",
      status: "open",
      reportedById: "u_faculty",
      reportedByName: "Dr. Farah Lee",
      contact: "faculty@campus.edu",
      createdAt: daysAgo(4),
    },
  ]

  const announcements: Announcement[] = [
    {
      id: "a_1",
      title: "Scheduled water maintenance",
      body: "Water supply in Block C will be interrupted on Saturday from 10am to 1pm for tank cleaning.",
      authorName: "Ava Admin",
      createdAt: daysAgo(2),
    },
    {
      id: "a_2",
      title: "Campus complaint system active",
      body: "Submit and track all facility complaints directly via the online portal.",
      authorName: "Ava Admin",
      createdAt: daysAgo(6),
    },
  ]

  const notifications: Notification[] = [
    {
      id: "n_1",
      userId: "u_student",
      message: "Your complaint CMP-1003 has been resolved.",
      href: "/portal/complaints",
      read: false,
      createdAt: daysAgo(6),
    },
    {
      id: "n_2",
      userId: "u_maint1",
      message: "New complaint CMP-1001 assigned to you.",
      href: "/maintenance",
      read: false,
      createdAt: daysAgo(2),
    },
  ]

  return {
    users,
    resources,
    complaints,
    lostFound,
    notifications,
    announcements,
    sessions: new Map(),
    seq: 1005,
  }
}

import fs from "fs"
import path from "path"

const DB_PATH = path.join(process.cwd(), ".data", "db.json")

function ensureDataDir() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function saveDb() {
  try {
    ensureDataDir()
    const data = {
      users: db.users,
      resources: db.resources,
      complaints: db.complaints,
      lostFound: db.lostFound,
      notifications: db.notifications,
      announcements: db.announcements,
      sessions: Array.from(db.sessions.entries()),
      seq: db.seq,
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8")
  } catch (err) {
    console.error("Failed to save DB:", err)
  }
}

function loadDb(): DB {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8")
      const parsed = JSON.parse(raw)
      return {
        users: parsed.users || [],
        resources: parsed.resources || [],
        complaints: parsed.complaints || [],
        lostFound: parsed.lostFound || [],
        notifications: parsed.notifications || [],
        announcements: parsed.announcements || [],
        sessions: new Map(parsed.sessions || []),
        seq: parsed.seq || 1005,
      }
    }
  } catch (err) {
    console.error("Failed to load DB, seeding new:", err)
  }
  const initial = seed()
  try {
    ensureDataDir()
    const data = {
      users: initial.users,
      resources: initial.resources,
      complaints: initial.complaints,
      lostFound: initial.lostFound,
      notifications: initial.notifications,
      announcements: initial.announcements,
      sessions: Array.from(initial.sessions.entries()),
      seq: initial.seq,
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8")
  } catch (err) {
    console.error("Failed to write initial DB:", err)
  }
  return initial
}

const g = globalThis as unknown as { __crmcrs_db?: DB }
export const db: DB = g.__crmcrs_db ?? (g.__crmcrs_db = loadDb())

export function nextCode() {
  db.seq += 1
  saveDb()
  return `CMP-${db.seq}`
}

export { uid }

