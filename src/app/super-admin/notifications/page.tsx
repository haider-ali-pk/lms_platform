"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell, Send, CheckCheck, School, Globe, RefreshCw, Pencil, Trash2, X, Save, ArrowLeft } from "lucide-react"

// ─── Types ───────────────────────────────────────────────
interface Notification {
  id: string
  title: string
  body: string
  type: string
  scope: string
  is_read: boolean
  created_at: string
  school?: { name: string } | null
  user?: { first_name: string; last_name: string; email: string; role: string } | null
}

interface School {
  id: string
  name: string
}

// ─── Helpers ─────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  general:            "bg-indigo-100 text-indigo-700",
  payment_alert:      "bg-red-100 text-red-700",
  assignment_due:     "bg-yellow-100 text-yellow-700",
  quiz_result:        "bg-green-100 text-green-700",
  attendance_alert:   "bg-orange-100 text-orange-700",
  certificate_earned: "bg-purple-100 text-purple-700",
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(date).toLocaleDateString()
}

// ─── Component ───────────────────────────────────────────
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [schools, setSchools]             = useState<School[]>([])
  const [total, setTotal]                 = useState(0)
  const [unread, setUnread]               = useState(0)
  const [page, setPage]                   = useState(1)
  const [loading, setLoading]             = useState(true)
  const [sending, setSending]             = useState(false)
  const [lastUpdated, setLastUpdated]     = useState<Date>(new Date())

  // Edit modal state
  const [editTarget, setEditTarget]   = useState<Notification | null>(null)
  const [editTitle, setEditTitle]     = useState("")
  const [editBody, setEditBody]       = useState("")
  const [editSaving, setEditSaving]   = useState(false)

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null)
  const [deleting, setDeleting]         = useState(false)

  // Send form state
  const [form, setForm] = useState({
    title: "", body: "", type: "general", scope: "all", school_id: "",
  })

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : ""

  // ── Fetch notifications ──
  const fetchNotifications = useCallback(async (p = 1) => {
    try {
      const res = await fetch(`/api/super-admin/notifications?page=${p}`, {
      })
      const data = await res.json()
      setNotifications(data.notifications || [])
      setTotal(data.total || 0)
      setUnread(data.unread || 0)
      setLastUpdated(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  // ── Fetch schools ──
  const fetchSchools = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/schools", {
      })
      const data = await res.json()
      setSchools(data.schools || [])
    } catch (err) {
      console.error(err)
    }
  }, [token])

  // ── Real-time polling every 10s ──
  useEffect(() => {
    fetchNotifications(page)
    fetchSchools()
    const interval = setInterval(() => fetchNotifications(page), 10000)
    return () => clearInterval(interval)
  }, [fetchNotifications, fetchSchools, page])

  // ── Send notification ──
  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) return
    if (form.scope === "school" && !form.school_id) return alert("Select a school")
    setSending(true)
    try {
      const res = await fetch("/api/super-admin/notifications", {
        method: "POST",
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setForm({ title: "", body: "", type: "general", scope: "all", school_id: "" })
        fetchNotifications(1)
        setPage(1)
      }
    } finally {
      setSending(false)
    }
  }

  // ── Mark all read ──
  const markAllRead = async () => {
    await fetch("/api/super-admin/notifications", {
      method: "PATCH",
    })
    fetchNotifications(page)
  }

  // ── Open edit modal ──
  const openEdit = (n: Notification) => {
    setEditTarget(n)
    setEditTitle(n.title)
    setEditBody(n.body)
  }

  // ── Save edit ──
  const handleEdit = async () => {
    if (!editTarget || !editTitle.trim() || !editBody.trim()) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/super-admin/notifications/${editTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: editTitle, body: editBody })
      })
      if (res.ok) {
        setEditTarget(null)
        fetchNotifications(page)
      }
    } finally {
      setEditSaving(false)
    }
  }

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/super-admin/notifications/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setDeleteTarget(null)
        fetchNotifications(page)
      }
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Back button */}
      <button onClick={() => window.history.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform-wide notification center
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Updated {timeAgo(lastUpdated.toISOString())}
          </span>
          {unread > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">
              <CheckCheck className="w-4 h-4" /> Mark all read ({unread})
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Sent", value: total,         color: "text-gray-900" },
          { label: "Unread",     value: unread,        color: "text-red-600"  },
          { label: "Read",       value: total - unread, color: "text-green-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Send Form ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" /> Send Notification
            </h2>
            <div className="flex gap-2">
              {["all", "school"].map((s) => (
                <button key={s} onClick={() => setForm({ ...form, scope: s, school_id: "" })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
                    form.scope === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {s === "all" ? <Globe className="w-3 h-3" /> : <School className="w-3 h-3" />}
                  {s === "all" ? "All Schools" : "One School"}
                </button>
              ))}
            </div>
            {form.scope === "school" && (
              <select value={form.school_id} onChange={(e) => setForm({ ...form, school_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select school...</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="general">General</option>
              <option value="payment_alert">Payment Alert</option>
              <option value="assignment_due">Assignment Due</option>
              <option value="attendance_alert">Attendance Alert</option>
              <option value="quiz_result">Quiz Result</option>
              <option value="certificate_earned">Certificate Earned</option>
            </select>
            <input type="text" placeholder="Notification title..." value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <textarea placeholder="Write your message..." value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            <button onClick={handleSend} disabled={sending || !form.title || !form.body}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
              {sending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Now</>}
            </button>
          </div>
        </div>

        {/* ── Notifications List ── */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white rounded-xl border border-gray-200">
              <Bell className="w-10 h-10 mb-2 opacity-30" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`bg-white rounded-xl border p-4 transition group ${
                !n.is_read ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[n.type] || "bg-gray-100 text-gray-600"}`}>
                        {n.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        {n.scope === "all"
                          ? <><Globe className="w-3 h-3" /> All Schools</>
                          : <><School className="w-3 h-3" /> {n.school?.name || "Unknown school"}</>}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 mt-1 text-sm">{n.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-400 mr-2">{timeAgo(n.created_at)}</span>
                    <button onClick={() => openEdit(n)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(n)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Edit Notification</h3>
              <button onClick={() => setEditTarget(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Message</label>
                <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditTarget(null)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleEdit} disabled={editSaving || !editTitle || !editBody}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                {editSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Notification</h3>
                <p className="text-sm text-gray-500">This cannot be undone.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">{deleteTarget.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{deleteTarget.body}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                {deleting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}