"use client"

import { useEffect, useState, useCallback } from "react"
import {
  ArrowLeft, Plus, BookOpen, Clock, CheckCircle,
  Users, Edit2, Trash2, Eye, X, Save, Loader2,
  FileText, AlertCircle, Award, ChevronDown, ChevronUp
} from "lucide-react"

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  max_marks: number
  is_published: boolean
  created_at: string
  course_id: string
  course: string
  submissions: number
}

interface Course {
  id: string
  title: string
}

interface Submission {
  id: string
  status: string
  marks: number | null
  feedback: string | null
  submitted_at: string
  graded_at: string | null
  file_url: string | null
  text_answer: string | null
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

interface AssignmentDetail {
  id: string
  title: string
  description: string
  due_date: string
  max_marks: number
  is_published: boolean
  course: { id: string; title: string; author_id: string }
  submissions: Submission[]
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  graded:    "bg-green-100 text-green-700",
  late:      "bg-red-100 text-red-700",
  missing:   "bg-gray-100 text-gray-500",
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses]         = useState<Course[]>([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState<"all" | "published" | "draft" | "overdue">("all")
  const [courseFilter, setCourseFilter] = useState("")

  // Create modal
  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm]   = useState({
    title: "", description: "", due_date: "", max_marks: 100,
    course_id: "", is_published: false,
  })
  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState("")

  // Detail + Grade modal
  const [detailModal, setDetailModal]     = useState(false)
  const [detail, setDetail]               = useState<AssignmentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [expandedSub, setExpandedSub]     = useState<string | null>(null)
  const [gradeForm, setGradeForm]         = useState<Record<string, { marks: string; feedback: string }>>({})
  const [grading, setGrading]             = useState<string | null>(null)

  // Edit modal
  const [editModal, setEditModal]   = useState(false)
  const [editForm, setEditForm]     = useState({
    title: "", description: "", due_date: "", max_marks: 100, is_published: false,
  })
  const [editing, setEditing]       = useState(false)
  const [editError, setEditError]   = useState("")

  const [toast, setToast] = useState<string | null>(null)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : ""

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/teacher/assignments", {
      })
      const data = await res.json()
      setAssignments(data.assignments || [])
      setCourses(data.courses || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const openDetail = async (id: string) => {
    setDetailModal(true)
    setDetailLoading(true)
    setDetail(null)
    try {
      const res  = await fetch(`/api/teacher/assignments/${id}`, {
      })
      const data = await res.json()
      setDetail(data)
      const gf: Record<string, { marks: string; feedback: string }> = {}
      for (const s of data.submissions || []) {
        gf[s.id] = { marks: s.marks?.toString() || "", feedback: s.feedback || "" }
      }
      setGradeForm(gf)
    } finally {
      setDetailLoading(false)
    }
  }

  const createAssignment = async () => {
    if (!createForm.title || !createForm.description || !createForm.due_date || !createForm.course_id) {
      setCreateError("All fields are required"); return
    }
    setCreating(true)
    setCreateError("")
    try {
      const res  = await fetch("/api/teacher/assignments", {
        method:  "POST"`, "Content-Type": "application/json" },
        body:    JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.error || "Failed"); return }
      setCreateModal(false)
      setCreateForm({ title: "", description: "", due_date: "", max_marks: 100, course_id: "", is_published: false })
      await fetchData()
      showToast("Assignment created!")
    } finally {
      setCreating(false)
    }
  }

  const saveEdit = async () => {
    if (!detail) return
    setEditing(true)
    setEditError("")
    try {
      const res  = await fetch(`/api/teacher/assignments/${detail.id}`, {
        method:  "PUT"`, "Content-Type": "application/json" },
        body:    JSON.stringify({ type: "edit", ...editForm, due_date: editForm.due_date }),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error || "Failed"); return }
      setEditModal(false)
      await openDetail(detail.id)
      await fetchData()
      showToast("Assignment updated!")
    } finally {
      setEditing(false)
    }
  }

  const gradeSubmission = async (subId: string) => {
    if (!detail) return
    setGrading(subId)
    try {
      const res = await fetch(`/api/teacher/assignments/${detail.id}`, {
        method:  "PUT"`, "Content-Type": "application/json" },
        body:    JSON.stringify({
          type:          "grade",
          submission_id: subId,
          marks:         parseInt(gradeForm[subId]?.marks || "0"),
          feedback:      gradeForm[subId]?.feedback || "",
        }),
      })
      if (res.ok) {
        await openDetail(detail.id)
        showToast("Graded successfully!")
      }
    } finally {
      setGrading(null)
    }
  }

  const deleteAssignment = async (id: string) => {
    if (!confirm("Delete this assignment?")) return
    await fetch(`/api/teacher/assignments/${id}`, {
      method: "DELETE"` },
    })
    await fetchData()
    showToast("Assignment deleted!")
  }

  const now = new Date()

  const filtered = assignments.filter((a) => {
    const isOverdue = new Date(a.due_date) < now && !a.is_published
    if (filter === "published" && !a.is_published) return false
    if (filter === "draft"     &&  a.is_published) return false
    if (filter === "overdue"   && new Date(a.due_date) >= now) return false
    if (courseFilter && a.course_id !== courseFilter) return false
    return true
  })

  const stats = {
    total:     assignments.length,
    published: assignments.filter((a) => a.is_published).length,
    draft:     assignments.filter((a) => !a.is_published).length,
    overdue:   assignments.filter((a) => new Date(a.due_date) < now).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {toast}
          </div>
        )}

        {/* Back */}
        <button onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" /> Assignments
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage and grade all your assignments</p>
          </div>
          <button onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> New Assignment
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total",     value: stats.total,     color: "text-indigo-600", bg: "bg-indigo-50",  border: "border-indigo-100", icon: <FileText className="w-4 h-4" />    },
            { label: "Published", value: stats.published, color: "text-green-600",  bg: "bg-green-50",   border: "border-green-100",  icon: <CheckCircle className="w-4 h-4" /> },
            { label: "Draft",     value: stats.draft,     color: "text-amber-600",  bg: "bg-amber-50",   border: "border-amber-100",  icon: <Clock className="w-4 h-4" />       },
            { label: "Overdue",   value: stats.overdue,   color: "text-red-600",    bg: "bg-red-50",     border: "border-red-100",    icon: <AlertCircle className="w-4 h-4" /> },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-4 flex items-center gap-3`}>
              <div className={`w-9 h-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {(["all", "published", "draft", "overdue"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${
                  filter === f ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                {f}
              </button>
            ))}
          </div>
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">All Courses</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} assignments</span>
        </div>

        {/* Assignment Cards */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No assignments found</p>
            <p className="text-gray-300 text-sm mt-1">Create your first assignment to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((a) => {
              const isOverdue = new Date(a.due_date) < now
              const daysLeft  = Math.ceil((new Date(a.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              return (
                <div key={a.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden group">
                  <div className={`h-1 ${a.is_published ? "bg-indigo-500" : "bg-amber-400"}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{a.title}</h3>
                        <p className="text-xs text-indigo-600 mt-0.5 truncate">{a.course}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${
                        a.is_published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {a.is_published ? "Published" : "Draft"}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{a.description}</p>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center bg-gray-50 rounded-xl p-2">
                        <p className="text-xs text-gray-400">Marks</p>
                        <p className="text-sm font-bold text-gray-700">{a.max_marks}</p>
                      </div>
                      <div className="text-center bg-gray-50 rounded-xl p-2">
                        <p className="text-xs text-gray-400">Submitted</p>
                        <p className="text-sm font-bold text-indigo-600">{a.submissions}</p>
                      </div>
                      <div className={`text-center rounded-xl p-2 ${isOverdue ? "bg-red-50" : "bg-emerald-50"}`}>
                        <p className="text-xs text-gray-400">Due</p>
                        <p className={`text-xs font-bold ${isOverdue ? "text-red-600" : "text-emerald-600"}`}>
                          {isOverdue ? "Overdue" : `${daysLeft}d`}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-4">
                      Due: {new Date(a.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>

                    <div className="flex gap-2">
                      <button onClick={() => openDetail(a.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button onClick={() => {
                        setEditForm({
                          title:        a.title,
                          description:  a.description,
                          due_date:     a.due_date.split("T")[0],
                          max_marks:    a.max_marks,
                          is_published: a.is_published,
                        })
                        openDetail(a.id).then(() => setEditModal(true))
                      }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-100 transition">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteAssignment(a.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 text-xs font-semibold rounded-xl hover:bg-red-100 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Create Modal ──────────────────────────────────────── */}
        {createModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">New Assignment</h2>
                <button onClick={() => setCreateModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {createError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{createError}</p>}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                  <input value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="Assignment title"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    rows={3} placeholder="Assignment instructions..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Course</label>
                    <select value={createForm.course_id} onChange={(e) => setCreateForm({ ...createForm, course_id: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select course</option>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Max Marks</label>
                    <input type="number" value={createForm.max_marks} onChange={(e) => setCreateForm({ ...createForm, max_marks: parseInt(e.target.value) })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                  <input type="datetime-local" value={createForm.due_date} onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCreateForm({ ...createForm, is_published: !createForm.is_published })}
                    className={`relative w-10 h-5 rounded-full transition ${createForm.is_published ? "bg-indigo-600" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${createForm.is_published ? "left-5" : "left-0.5"}`} />
                  </button>
                  <span className="text-sm text-gray-600">{createForm.is_published ? "Publish immediately" : "Save as draft"}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button onClick={() => setCreateModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={createAssignment} disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition font-semibold">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Assignment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Detail + Grade Modal ──────────────────────────────── */}
        {detailModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-4xl my-8 shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">
                  {detailLoading ? "Loading..." : detail?.title}
                </h2>
                <div className="flex items-center gap-2">
                  {detail && (
                    <button onClick={() => {
                      setEditForm({
                        title:        detail.title,
                        description:  detail.description,
                        due_date:     detail.due_date.split("T")[0],
                        max_marks:    detail.max_marks,
                        is_published: detail.is_published,
                      })
                      setEditModal(true)
                    }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  <button onClick={() => { setDetailModal(false); setDetail(null) }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {detailLoading ? (
                <div className="flex items-center justify-center h-48 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
                </div>
              ) : detail ? (
                <div className="p-6 space-y-6">

                  {/* Assignment Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Course",     value: detail.course.title },
                      { label: "Max Marks",  value: String(detail.max_marks) },
                      { label: "Due Date",   value: new Date(detail.due_date).toLocaleDateString() },
                      { label: "Status",     value: detail.is_published ? "Published" : "Draft" },
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="font-semibold text-gray-800 mt-0.5 text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-indigo-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-indigo-600 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{detail.description}</p>
                  </div>

                  {/* Submissions */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">
                      Submissions ({detail.submissions.length})
                    </h3>

                    {detail.submissions.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-400 text-sm">
                        No submissions yet
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {detail.submissions.map((sub) => {
                          const isExpanded = expandedSub === sub.id
                          const gf = gradeForm[sub.id] || { marks: "", feedback: "" }
                          return (
                            <div key={sub.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                              <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition">
                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                  {sub.student.first_name[0]}{sub.student.last_name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {sub.student.first_name} {sub.student.last_name}
                                  </p>
                                  <p className="text-xs text-gray-400">{sub.student.email}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[sub.status] || "bg-gray-100 text-gray-500"}`}>
                                    {sub.status}
                                  </span>
                                  {sub.marks !== null && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                                      <Award className="w-3.5 h-3.5" /> {sub.marks}/{detail.max_marks}
                                    </span>
                                  )}
                                  <p className="text-xs text-gray-400">
                                    {new Date(sub.submitted_at).toLocaleDateString()}
                                  </p>
                                  <button onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition">
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 space-y-4">
                                  {sub.text_answer && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-600 mb-1">Answer</p>
                                      <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-gray-100">
                                        {sub.text_answer}
                                      </p>
                                    </div>
                                  )}
                                  {sub.file_url && (
                                    <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
                                      <FileText className="w-4 h-4" /> View Attachment
                                    </a>
                                  )}

                                  {/* Grade Form */}
                                  <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                                    <p className="text-xs font-semibold text-gray-700">Grade This Submission</p>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-1">Marks (out of {detail.max_marks})</label>
                                        <input type="number" min="0" max={detail.max_marks}
                                          value={gf.marks}
                                          onChange={(e) => setGradeForm({ ...gradeForm, [sub.id]: { ...gf, marks: e.target.value } })}
                                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-1">Feedback</label>
                                        <input value={gf.feedback}
                                          onChange={(e) => setGradeForm({ ...gradeForm, [sub.id]: { ...gf, feedback: e.target.value } })}
                                          placeholder="Optional feedback..."
                                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                      </div>
                                    </div>
                                    <button onClick={() => gradeSubmission(sub.id)} disabled={grading === sub.id}
                                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition">
                                      {grading === sub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                                      Save Grade
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ── Edit Modal ────────────────────────────────────────── */}
        {editModal && detail && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Edit Assignment</h2>
                <button onClick={() => setEditModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {editError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{editError}</p>}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                  <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                    <input type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Max Marks</label>
                    <input type="number" value={editForm.max_marks} onChange={(e) => setEditForm({ ...editForm, max_marks: parseInt(e.target.value) })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditForm({ ...editForm, is_published: !editForm.is_published })}
                    className={`relative w-10 h-5 rounded-full transition ${editForm.is_published ? "bg-indigo-600" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${editForm.is_published ? "left-5" : "left-0.5"}`} />
                  </button>
                  <span className="text-sm text-gray-600">{editForm.is_published ? "Published" : "Draft"}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button onClick={() => setEditModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={saveEdit} disabled={editing}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition font-semibold">
                  {editing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
