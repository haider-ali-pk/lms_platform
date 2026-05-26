"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Author {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

interface Enrollment {
  id: string;
  enrolled_at: string;
  completed_at: string | null;
  student: Student;
}

interface CourseCount {
  enrollments: number;
  lessons: number;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  author: Author;
  enrollments: Enrollment[];
  _count: CourseCount;
}

interface EditForm {
  title: string;
  description: string;
  is_published: boolean;
}

export default function ManageCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", description: "", is_published: false });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [enrollCourse, setEnrollCourse] = useState<Course | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const [viewCourse, setViewCourse] = useState<Course | null>(null);
  const [unenrolling, setUnenrolling] = useState<string | null>(null);

  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/courses?search=${encodeURIComponent(search)}&page=${page}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      setCourses(data.courses || []);
      setTotal(data.total || 0);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  async function fetchAllStudents() {
    try {
      const res = await fetch(`/api/admin/users?role=student&limit=10000&page=1`, {
        credentials: 'include',
      });
      const data = await res.json();
      setAllStudents(data.users || []);
    } catch {
      setAllStudents([]);
    }
  }

  function openEdit(course: Course) {
    setEditCourse(course);
    setEditForm({
      title: course.title,
      description: course.description || "",
      is_published: course.is_published,
    });
    setEditError("");
  }

  async function handleEditSubmit() {
    if (!editCourse) return;
    setEditError("");
    if (!editForm.title) {
      setEditError("Title is required.");
      return;
    }
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/admin/courses/${editCourse.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Something went wrong.");
        return;
      }
      setEditCourse(null);
      fetchCourses();
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function openEnroll(course: Course) {
    setEnrollCourse(course);
    setStudentSearch("");
    await fetchAllStudents();
  }

  async function handleEnroll(studentId: string) {
    if (!enrollCourse) return;
    setEnrolling(true);
    try {
      const res = await fetch(`/api/admin/courses/${enrollCourse.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ student_id: studentId }),
      });
      if (res.ok) {
        setEnrollCourse(null);
        fetchCourses();
      }
    } catch {
      // silent
    } finally {
      setEnrolling(false);
    }
  }

  async function handleUnenroll(courseId: string, studentId: string) {
    setUnenrolling(studentId);
    try {
      await fetch(`/api/admin/courses/${courseId}?student_id=${studentId}`, {
        method: "DELETE",
        credentials: 'include',
      });
      fetchCourses();
      if (viewCourse) {
        setViewCourse((prev) =>
          prev
            ? {
                ...prev,
                enrollments: prev.enrollments.filter((e) => e.student.id !== studentId),
                _count: { ...prev._count, enrollments: prev._count.enrollments - 1 },
              }
            : null
        );
      }
    } catch {
      // silent
    } finally {
      setUnenrolling(null);
    }
  }

  const enrolledIds = enrollCourse?.enrollments.map((e) => e.student.id) || [];
  const filteredStudents = allStudents.filter(
    (s) =>
      !enrolledIds.includes(s.id) &&
      (s.first_name + " " + s.last_name + " " + s.email)
        .toLowerCase()
        .includes(studentSearch.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
          <p className="text-sm text-gray-500">{total} total courses in your school</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by title or description..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Course</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Teacher</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Lessons</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Enrolled</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No courses found.
                </td>
              </tr>
            ) : (
              courses.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{c.title}</p>
                      {c.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{c.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                        {c.author.first_name[0]}{c.author.last_name[0]}
                      </div>
                      <span className="text-gray-700 text-xs">
                        {c.author.first_name} {c.author.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c._count.lessons}</td>
                  <td className="px-4 py-3">
                    {c._count.enrollments === 0 ? (
                      <span className="text-gray-400 text-xs">No students</span>
                    ) : (
                      <button
                        onClick={() => setViewCourse(c)}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                          {c._count.enrollments}
                        </span>
                        View
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {c.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openEnroll(c)}
                        className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors"
                      >
                        Enroll
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Edit Course</h2>
              <button onClick={() => setEditCourse(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editError && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                {editError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700">Status</label>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, is_published: !editForm.is_published })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    editForm.is_published ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    editForm.is_published ? "translate-x-5" : "translate-x-1"
                  }`} />
                </button>
                <span className="text-xs text-gray-500">
                  {editForm.is_published ? "Published" : "Draft"}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditCourse(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editSubmitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Student Modal */}
      {enrollCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Enroll Student</h2>
                <p className="text-sm text-gray-500">{enrollCourse.title}</p>
              </div>
              <button onClick={() => setEnrollCourse(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              placeholder="Search students..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            />
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">No students available to enroll.</p>
              ) : (
                filteredStudents.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                        {s.first_name[0]}{s.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEnroll(s.id)}
                      disabled={enrolling}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-60"
                    >
                      Enroll
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setEnrollCourse(null)}
              className="mt-4 w-full border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* View Enrolled Students Modal */}
      {viewCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{viewCourse.title}</h2>
                <p className="text-sm text-gray-500">{viewCourse.enrollments.length} enrolled students</p>
              </div>
              <button onClick={() => setViewCourse(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {viewCourse.enrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                      {e.student.first_name[0]}{e.student.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {e.student.first_name} {e.student.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{e.student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      e.completed_at ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {e.completed_at ? "Completed" : "In Progress"}
                    </span>
                    <button
                      onClick={() => handleUnenroll(viewCourse.id, e.student.id)}
                      disabled={unenrolling === e.student.id}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-60"
                    >
                      {unenrolling === e.student.id ? "..." : "Unenroll"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setViewCourse(null)}
              className="mt-5 w-full border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
