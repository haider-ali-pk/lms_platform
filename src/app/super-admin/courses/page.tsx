"use client"

import { useEffect, useState, useCallback } from "react"
import {
  BookOpen, Users, CheckCircle, Clock, RefreshCw,
  Search, ArrowLeft, Edit2, UserPlus, X, Save, Loader2, Trash2
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts"

interface KPI {
  totalCourses: number
  totalEnrollments: number
  publishedCourses: number
  draftCourses: number
}

interface TopCourse {
  id: string
  title: string
  subject: string | null
  school: string
  enrollments: number
  is_published: boolean
}

interface Course {
  id: string
  title: string
  subject: string | null
  grade_level: string | null
  is_published: boolean
  created_at: string
  school_id: string
  school: string
  enrollments: number
  lessons: number
}

interface School {
  id: string
  name: string
}

interface EnrolledStudent {
  id: string
  enrolled_at: string
  completed_at: string | null
  student_id: string
  first_name: string
  last_name: string
  email: string
  lessons_done: number
  lessons_total: number
  progress_pct: number
}

interface CourseDetail {
  id: string
  title: string
  subject: string | null
  grade_level: string | null
  is_published: boolean
  created_at: string
  school_id: string
  school: string
  lessons: number
  enrollments: EnrolledStudent[]
}

interface StudentSearchResult {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function CoursesPage() {
  const [kpi, setKpi]               = useState<KPI | null>(null)
  const [topCourses, setTopCourses] = useState<TopCourse[]>([])
  const [courses, setCourses]       = useState<Course[]>([])
  const [schools, setSchools]       = useState<School[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [schoolFilter, setSchoolFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const [detailModal, setDetailModal]     = useState(false)
  const [courseDetail, setCourseDetail]   = useState<CourseDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [editModal, setEditModal]     = useState(false)
  const [editCourseId, setEditCourseId] = useState<string | null>(null)
  const [editForm, setEditForm]       = useState({ title: "", subject: "", grade_level: "", is_published: false })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError]     = useState("")

  const [studentSearch, setStudentSearch]         = useState("")
  const [studentResults, setStudentResults]       = useState<StudentSearchResult[]>([])
  const [searchingStudents, setSearchingStudents] = useState(false)
  const [enrollingId, setEnrollingId]             = useState<string | null>(null)
  const [unenrollingId, setUnenrollingId]         = useState<string | null>(null)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : ""

  const fetchData = useCallback(async (sid = "") => {
    setLoading(true)
    try {
      const url = sid ? `/api/super-admin/courses?school_id=${sid}` : "/api/super-admin/courses"
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setKpi(data.kpi)
      setTopCourses(data.topCourses || [])
      setCourses(data.courses || [])
      setSchools(data.schools || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const openDetail = async (courseId: string) => {
    setDetailModal(true)
    setDetailLoading(true)
    setCourseDetail(null)
    setStudentSearch("")
    setStudentResults([])
    try {
      const res = await fetch(`/api/super-admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setCourseDetail(data)
    } catch (err) {
      console.error(err)
    } finally {
      setDetailLoading(false)
    }
  }

  const openEdit = (c: Course) => {
    setEditCourseId(c.id)
    setEditForm({
      title:        c.title,
      subject:      c.subject || "",
      grade_level:  c.grade_level || "",
      is_published: c.is_published,
    })
    setEditError("")
    setEditModal(true)
  }

  const openEditFromDetail = () => {
    if (!courseDetail) return
    setEditCourseId(courseDetail.id)
    setEditForm({
      title:        courseDetail.title,
      subject:      courseDetail.subject || "",
      grade_level:  courseDetail.grade_level || "",
      is_published: courseDetail.is_published,
    })
    setEditError("")
    setEditModal(true)
  }

  const saveEdit = async () => {
    if (!editCourseId) return
    setEditLoading(true)
    setEditError("")
    try {
      const res = await fetch(`/api/super-admin/courses/${editCourseId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error || "Failed to save"); return }
      setEditModal(false)
      await openDetail(editCourseId)
      await fetchData(schoolFilter)
    } catch {
      setEditError("Network error")
    } finally {
      setEditLoading(false)
    }
  }

  const searchStudents = async (q: string) => {
    setStudentSearch(q)
    if (!courseDetail || q.length < 2) { setStudentResults([]); return }
    setSearchingStudents(true)
    try {
      const res = await fetch(
        `/api/super-admin/courses/${courseDetail.id}/enrollments?q=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      setStudentResults(data.students || [])
    } catch {
      setStudentResults([])
    } finally {
      setSearchingStudents(false)
    }
  }

  const enrollStudent = async (studentId: string) => {
    if (!courseDetail) return
    setEnrollingId(studentId)
    try {
      const res = await fetch(`/api/super-admin/courses/${courseDetail.id}/enrollments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId }),
      })
      if (res.ok) {
        setStudentSearch("")
        setStudentResults([])
        await openDetail(courseDetail.id)
        await fetchData(schoolFilter)
      }
    } finally {
      setEnrollingId(null)
    }
  }

  const unenrollStudent = async (studentId: string) => {
    if (!courseDetail) return
    if (!confirm("Remove this student from the course?")) return
    setUnenrollingId(studentId)
    try {
      const res = await fetch(`/api/super-admin/courses/${courseDetail.id}/enrollments`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId }),
      })
      if (res.ok) {
        await openDetail(courseDetail.id)
        await fetchData(schoolFilter)
      }
    } finally {
      setUnenrollingId(null)
    }
  }

  const filtered = courses.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.school.toLowerCase().includes(search.toLowerCase()) ||
      (c.subject || "").toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === "" ? true :
      statusFilter === "published" ? c.is_published : !c.is_published
    return matchSearch && matchStatus
  })

  const chartData = topCourses.map((c) => ({
    ...c,
    shortTitle: c.title.length > 22 ? c.title.slice(0, 22) + "…" : c.title,
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    )
  }

  return (
    <div className="w-full max-w-none p-6 space-y-6">

      <button onClick={() => window.history.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" /> Courses
        </h1>
        <p className="text-sm text-gray-500 mt-1">All courses across every school</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: "Total Courses",     value: kpi?.totalCourses || 0,     icon: <BookOpen className="w-5 h-5" />,     color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total Enrollments", value: kpi?.totalEnrollments || 0, icon: <Users className="w-5 h-5" />,       color: "text-blue-600",   bg: "bg-blue-50"   },
          { label: "Published",         value: kpi?.publishedCourses || 0, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600",  bg: "bg-green-50"  },
          { label: "Drafts",            value: kpi?.draftCourses || 0,     icon: <Clock className="w-5 h-5" />,       color: "text-yellow-600", bg: "bg-yellow-50" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${k.bg} ${k.color} flex items-center justify-center flex-shrink-0`}>
              {k.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Top 10 Most Enrolled Courses</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 15, bottom: 10 }} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="shortTitle" tick={{ fontSize: 10 }} width={140} />
            <Tooltip formatter={(v: any) => [String(v), "Enrollments"]} />
            <Bar dataKey="enrollments" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
        </div>
        <select value={schoolFilter} onChange={(e) => { setSchoolFilter(e.target.value); fetchData(e.target.value) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Schools</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Course</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">School</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Grade</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lessons</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Enrollments</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No courses found</td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">{c.title}</td>
                <td className="px-4 py-3 text-gray-600">{c.school}</td>
                <td className="px-4 py-3 text-gray-500">{c.subject || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.grade_level || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{c.lessons}</td>
                <td className="px-4 py-3 text-gray-700">{c.enrollments}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {c.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openDetail(c.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition">
                      <Users className="w-3 h-3" /> Students
                    </button>
                    <button onClick={() => openEdit(c)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl my-8 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900">
                  {detailLoading ? "Loading..." : courseDetail?.title}
                </h2>
                {courseDetail && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${courseDetail.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {courseDetail.is_published ? "Published" : "Draft"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {courseDetail && (
                  <button onClick={openEditFromDetail}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                    <Edit2 className="w-3.5 h-3.5" /> Edit Course
                  </button>
                )}
                <button onClick={() => { setDetailModal(false); setCourseDetail(null) }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center h-48 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
              </div>
            ) : courseDetail ? (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "School",  value: courseDetail.school },
                    { label: "Subject", value: courseDetail.subject || "—" },
                    { label: "Grade",   value: courseDetail.grade_level || "—" },
                    { label: "Lessons", value: String(courseDetail.lessons ?? "0") },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="font-semibold text-gray-800 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-indigo-600" /> Add Student to Course
                  </h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input value={studentSearch} onChange={(e) => searchStudents(e.target.value)}
                      placeholder="Search by name or email..."
                      className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full" />
                    {searchingStudents && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-2.5 text-gray-400" />}
                  </div>
                  {studentResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                      {studentResults.map((s) => (
                        <div key={s.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{s.first_name} {s.last_name}</p>
                            <p className="text-xs text-gray-500">{s.email}</p>
                          </div>
                          <button onClick={() => enrollStudent(s.id)} disabled={enrollingId === s.id}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                            {enrollingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                            Enroll
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {studentSearch.length >= 2 && !searchingStudents && studentResults.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2 pl-1">No students found</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Enrolled Students ({(courseDetail.enrollments ?? []).length})
                  </h3>
                  {(courseDetail.enrollments ?? []).length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl">
                      No students enrolled yet
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Student</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Email</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Enrolled</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Progress</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-2.5"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(courseDetail.enrollments ?? []).map((e) => (
                            <tr key={e.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2.5 font-medium text-gray-900">{e.first_name} {e.last_name}</td>
                              <td className="px-4 py-2.5 text-gray-500 text-xs">{e.email}</td>
                              <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${e.progress_pct}%` }} />
                                  </div>
                                  <span className="text-xs text-gray-500">{e.progress_pct}%</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{e.lessons_done}/{e.lessons_total} lessons</p>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.completed_at ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                  {e.completed_at ? "Completed" : "In Progress"}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <button onClick={() => unenrollStudent(e.student_id)} disabled={unenrollingId === e.student_id}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
                                  {unenrollingId === e.student_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Edit Course</h2>
              <button onClick={() => setEditModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {editError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{editError}</p>}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
                <input value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Grade Level</label>
                <input value={editForm.grade_level} onChange={(e) => setEditForm({ ...editForm, grade_level: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-600">Published</label>
                <button onClick={() => setEditForm({ ...editForm, is_published: !editForm.is_published })}
                  className={`relative w-10 h-5 rounded-full transition ${editForm.is_published ? "bg-indigo-600" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${editForm.is_published ? "left-5" : "left-0.5"}`} />
                </button>
                <span className="text-xs text-gray-500">{editForm.is_published ? "Published" : "Draft"}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={editLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}