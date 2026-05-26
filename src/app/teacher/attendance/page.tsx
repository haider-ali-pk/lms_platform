"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Calendar, CheckCircle, XCircle,
  Clock, AlertCircle, Save, Loader2, Users,
  ChevronLeft, ChevronRight, BarChart2
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────
interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface AttendanceRecord {
  id: string
  status: string
  note: string | null
}

interface ClassInfo {
  id: string
  name: string
  grade: string | null
  section: string | null
  academic_year: string | null
}

type AttendanceStatus = "present" | "absent" | "late" | "excused"

const STATUS_CONFIG: Record<AttendanceStatus, {
  label: string
  color: string
  bg: string
  border: string
  activeBg: string
  icon: React.ReactNode
}> = {
  present: {
    label: "Present",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    activeBg: "bg-emerald-500",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  absent: {
    label: "Absent",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    activeBg: "bg-red-500",
    icon: <XCircle className="w-4 h-4" />,
  },
  late: {
    label: "Late",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    activeBg: "bg-amber-500",
    icon: <Clock className="w-4 h-4" />,
  },
  excused: {
    label: "Excused",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    activeBg: "bg-blue-500",
    icon: <AlertCircle className="w-4 h-4" />,
  },
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0]
}

function displayDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  })
}

// ── Main Component ────────────────────────────────────────────────
function AttendanceContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const class_id     = searchParams.get("class")

  const [classInfo, setClassInfo]     = useState<ClassInfo | null>(null)
  const [students, setStudents]       = useState<Student[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord>>({})
  const [localStatus, setLocalStatus] = useState<Record<string, AttendanceStatus>>({})
  const [localNote, setLocalNote]     = useState<Record<string, string>>({})
  const [summary, setSummary]         = useState<Record<string, number>>({})
  const [recentDates, setRecentDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [activeNote, setActiveNote]   = useState<string | null>(null)
  const [view, setView]               = useState<"mark" | "summary">("mark")

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : ""

  const fetchAttendance = useCallback(async (date: string) => {
    if (!class_id) return
    setLoading(true)
    try {
      const res  = await fetch(
        `/api/teacher/attendance?class_id=${class_id}&date=${date}`,
      )
      const data = await res.json()
      setClassInfo(data.classInfo)
      setStudents(data.students || [])
      setAttendanceMap(data.attendanceMap || {})
      setSummary(data.summary || {})
      setRecentDates(data.recentDates || [])

      // Init local status — default present if no record
      const initStatus: Record<string, AttendanceStatus> = {}
      const initNote:   Record<string, string>            = {}
      for (const s of data.students || []) {
        initStatus[s.id] = (data.attendanceMap?.[s.id]?.status as AttendanceStatus) || "present"
        initNote[s.id]   = data.attendanceMap?.[s.id]?.note || ""
      }
      setLocalStatus(initStatus)
      setLocalNote(initNote)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [class_id, token])

  useEffect(() => { fetchAttendance(selectedDate) }, [fetchAttendance, selectedDate])

  const setAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {}
    for (const s of students) next[s.id] = status
    setLocalStatus(next)
  }

  const saveAttendance = async () => {
    if (!class_id) return
    setSaving(true)
    try {
      const records = students.map((s) => ({
        student_id: s.id,
        status:     localStatus[s.id] || "present",
        note:       localNote[s.id]   || "",
      }))
      const res = await fetch("/api/teacher/attendance", {
        method:  "POST",
        body:    JSON.stringify({ class_id, date: selectedDate, records }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        await fetchAttendance(selectedDate)
      }
    } finally {
      setSaving(false)
    }
  }

  const goDate = (offset: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + offset)
    setSelectedDate(formatDate(d))
  }

  const isToday = selectedDate === formatDate(new Date())

  // Stats for selected date
  const counts = { present: 0, absent: 0, late: 0, excused: 0 }
  for (const s of students) {
    const st = localStatus[s.id] || "present"
    counts[st as AttendanceStatus]++
  }
  const attendanceRate = students.length > 0
    ? Math.round(((counts.present + counts.late) / students.length) * 100)
    : 0

  if (!class_id) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No class selected
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Classes
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {classInfo?.name || "Loading..."}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {classInfo?.grade && `Grade ${classInfo.grade}`}
                    {classInfo?.section && ` · Section ${classInfo.section}`}
                    {classInfo?.academic_year && ` · ${classInfo.academic_year}`}
                  </p>
                </div>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setView("mark")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  view === "mark" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                <CheckCircle className="w-4 h-4" /> Mark
              </button>
              <button onClick={() => setView("summary")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  view === "summary" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                <BarChart2 className="w-4 h-4" /> Summary
              </button>
            </div>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <button onClick={() => goDate(-1)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <input
                type="date"
                value={selectedDate}
                max={formatDate(new Date())}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm font-medium text-gray-800 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {isToday && (
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                  Today
                </span>
              )}
              <span className="text-sm text-gray-500 hidden sm:block">
                {displayDate(selectedDate)}
              </span>
            </div>
            <button onClick={() => goDate(1)} disabled={isToday}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((st) => {
            const cfg = STATUS_CONFIG[st]
            return (
              <div key={st} className={`bg-white rounded-2xl border ${cfg.border} p-4 flex items-center gap-3`}>
                <div className={`w-9 h-9 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                  {cfg.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-500">{cfg.label}</p>
                  <p className={`text-xl font-bold ${cfg.color}`}>{counts[st]}</p>
                </div>
              </div>
            )
          })}
          <div className="bg-white rounded-2xl border border-indigo-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Rate</p>
              <p className="text-xl font-bold text-indigo-600">{attendanceRate}%</p>
            </div>
          </div>
        </div>

        {/* Mark View */}
        {view === "mark" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Mark all:</span>
                {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((st) => {
                  const cfg = STATUS_CONFIG[st]
                  return (
                    <button key={st} onClick={() => setAll(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${cfg.bg} ${cfg.color} ${cfg.border} hover:opacity-80`}>
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
                <button onClick={saveAttendance} disabled={saving || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Attendance
                </button>
              </div>
            </div>

            {/* Student List */}
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading students...
              </div>
            ) : students.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No students found for this class
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {students.map((student, idx) => {
                  const status = localStatus[student.id] || "present"
                  const cfg    = STATUS_CONFIG[status]
                  const note   = localNote[student.id] || ""
                  const isNoteOpen = activeNote === student.id

                  return (
                    <div key={student.id}
                      className={`px-6 py-4 hover:bg-gray-50 transition ${cfg.bg.replace("bg-", "hover:bg-").replace("-50", "-25")} `}>
                      <div className="flex items-center gap-4 flex-wrap">

                        {/* Index + Avatar */}
                        <div className="flex items-center gap-3 flex-1 min-w-[160px]">
                          <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0">{idx + 1}</span>
                          <div className={`w-9 h-9 rounded-full ${cfg.bg} ${cfg.color} flex items-center justify-center text-sm font-bold flex-shrink-0 border ${cfg.border}`}>
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs text-gray-400">{student.email}</p>
                          </div>
                        </div>

                        {/* Status Buttons */}
                        <div className="flex items-center gap-1.5">
                          {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((st) => {
                            const c   = STATUS_CONFIG[st]
                            const sel = status === st
                            return (
                              <button key={st}
                                onClick={() => setLocalStatus({ ...localStatus, [student.id]: st })}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                  sel
                                    ? `${c.activeBg} text-white border-transparent shadow-sm`
                                    : `${c.bg} ${c.color} ${c.border} hover:opacity-80`
                                }`}>
                                {c.icon}
                                <span className="hidden sm:inline">{c.label}</span>
                              </button>
                            )
                          })}
                        </div>

                        {/* Note toggle */}
                        <button
                          onClick={() => setActiveNote(isNoteOpen ? null : student.id)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${
                            note
                              ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                              : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                          }`}>
                          {note ? "📝 Note" : "+ Note"}
                        </button>
                      </div>

                      {/* Note Input */}
                      {isNoteOpen && (
                        <div className="mt-3 ml-16">
                          <input
                            value={note}
                            onChange={(e) => setLocalNote({ ...localNote, [student.id]: e.target.value })}
                            placeholder="Add a note (optional)..."
                            className="w-full max-w-md text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Footer Save */}
            {students.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                <button onClick={saveAttendance} disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save {students.length} Records
                </button>
              </div>
            )}
          </div>
        )}

        {/* Summary View */}
        {view === "summary" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h2 className="font-semibold text-gray-800">Last 30 Days Summary</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((st) => {
                const cfg   = STATUS_CONFIG[st]
                const count = summary[st] || 0
                const total = Object.values(summary).reduce((a, b) => a + b, 0)
                const pct   = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={st} className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5`}>
                    <div className={`flex items-center gap-2 ${cfg.color} mb-2`}>
                      {cfg.icon}
                      <span className="text-sm font-semibold">{cfg.label}</span>
                    </div>
                    <p className={`text-3xl font-bold ${cfg.color}`}>{count}</p>
                    <div className="mt-2 bg-white bg-opacity-60 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full ${cfg.activeBg} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className={`text-xs mt-1 ${cfg.color} opacity-70`}>{pct}% of total</p>
                  </div>
                )
              })}
            </div>

            {/* Recent Dates */}
            {recentDates.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Attendance Dates</h3>
                <div className="flex flex-wrap gap-2">
                  {recentDates.slice(0, 15).map((d) => {
                    const dateStr = formatDate(new Date(d))
                    const isSelected = dateStr === selectedDate
                    return (
                      <button key={dateStr}
                        onClick={() => { setSelectedDate(dateStr); setView("mark") }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                        }`}>
                        {new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default function AttendancePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    }>
      <AttendanceContent />
    </Suspense>
  )
}