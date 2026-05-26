"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ClassTeacherEntry {
  id: string;
  teacher: Teacher;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

interface ClassStudent {
  student_id: string;
  student: Student;
}

interface Class {
  id: string;
  name: string;
  grade: string | null;
  section: string | null;
  academic_year: string | null;
  created_at: string;
  teachers: ClassTeacherEntry[];
  students: ClassStudent[] | null;
  _count: { attendance: number };
}

interface CreateForm {
  name: string;
  grade: string;
  section: string;
  academic_year: string;
}

export default function ManageClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({ name: "", grade: "", section: "", academic_year: "" });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editClass, setEditClass] = useState<Class | null>(null);
  const [editForm, setEditForm] = useState<CreateForm>({ name: "", grade: "", section: "", academic_year: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [assignClass, setAssignClass] = useState<Class | null>(null);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState<string | null>(null);

  const [studentClass, setStudentClass] = useState<Class | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [removingStudent, setRemovingStudent] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const limit = 10;
  const totalPages = Math.ceil(total / limit);
  const token = () => localStorage.getItem("token");

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/classes?search=${encodeURIComponent(search)}&page=${page}`,
      );
      const data = await res.json();
      setClasses(data.classes || []);
      setTotal(data.total || 0);
    } catch {
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  async function fetchAllTeachers() {
    try {
      const res = await fetch(`/api/admin/teachers?limit=10000&page=1`, {
      });
      const data = await res.json();
      setAllTeachers(data.teachers || []);
    } catch {
      setAllTeachers([]);
    }
  }

  async function fetchAllStudents() {
    try {
      const res = await fetch(`/api/admin/students?limit=10000&page=1`, {
      });
      const data = await res.json();
      setAllStudents(data.students || []);
    } catch {
      setAllStudents([]);
    }
  }

  async function handleCreate() {
    setCreateError("");
    if (!createForm.name.trim()) { setCreateError("Class name is required."); return; }
    setCreateSubmitting(true);
    try {
      const res = await fetch(`/api/admin/classes`, {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || "Failed to create class."); return; }
      setShowCreate(false);
      setCreateForm({ name: "", grade: "", section: "", academic_year: "" });
      fetchClasses();
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreateSubmitting(false);
    }
  }

  function openEdit(c: Class) {
    setEditClass(c);
    setEditForm({ name: c.name, grade: c.grade || "", section: c.section || "", academic_year: c.academic_year || "" });
    setEditError("");
  }

  async function handleEdit() {
    if (!editClass) return;
    setEditError("");
    if (!editForm.name.trim()) { setEditError("Class name is required."); return; }
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/admin/classes/${editClass.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || "Failed to update class."); return; }
      setEditClass(null);
      fetchClasses();
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this class? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/classes/${id}`, {
        method: "DELETE",
      });
      fetchClasses();
    } finally {
      setDeletingId(null);
    }
  }

  async function openAssign(c: Class) {
    setAssignClass(c);
    setTeacherSearch("");
    await fetchAllTeachers();
  }

  async function handleAssign(teacherId: string) {
    if (!assignClass) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/classes/${assignClass.id}`, {
        method: "PUT",
        body: JSON.stringify({ assign_teacher_id: teacherId }),
      });
      if (res.ok) {
        const updated = await fetch(`/api/admin/classes?search=&page=1`, {
        }).then(r => r.json());
        const found = (updated.classes || []).find((c: Class) => c.id === assignClass.id);
        if (found) setAssignClass(found);
        fetchClasses();
      }
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnassign(teacherId: string) {
    if (!assignClass) return;
    setUnassigning(teacherId);
    try {
      const res = await fetch(`/api/admin/classes/${assignClass.id}`, {
        method: "PUT",
        body: JSON.stringify({ unassign_teacher_id: teacherId }),
      });
      if (res.ok) {
        setAssignClass((prev) =>
          prev ? { ...prev, teachers: prev.teachers.filter((t) => t.teacher.id !== teacherId) } : null
        );
        fetchClasses();
      }
    } finally {
      setUnassigning(null);
    }
  }

  async function openStudentModal(c: Class) {
    setStudentClass(c);
    setStudentSearch("");
    await fetchAllStudents();
  }

  async function handleAddStudent(studentId: string) {
    if (!studentClass) return;
    setAddingStudent(true);
    try {
      const res = await fetch(`/api/admin/classes/${studentClass.id}`, {
        method: "PUT",
        body: JSON.stringify({ add_student_id: studentId }),
      });
      if (res.ok) {
        const added = allStudents.find(s => s.id === studentId);
        if (added) {
          setStudentClass(prev => prev ? {
            ...prev,
            students: [...(prev.students ?? []), { student_id: studentId, student: added }],
          } : null);
        }
        fetchClasses();
      }
    } finally {
      setAddingStudent(false);
    }
  }

  async function handleRemoveStudent(studentId: string) {
    if (!studentClass) return;
    setRemovingStudent(studentId);
    try {
      const res = await fetch(`/api/admin/classes/${studentClass.id}`, {
        method: "PUT",
        body: JSON.stringify({ remove_student_id: studentId }),
      });
      if (res.ok) {
        setStudentClass(prev =>
          prev ? { ...prev, students: (prev.students ?? []).filter(s => s.student_id !== studentId) } : null
        );
        fetchClasses();
      }
    } finally {
      setRemovingStudent(null);
    }
  }

  const assignedTeacherIds = assignClass?.teachers.map((t) => t.teacher.id) ?? [];
  const filteredTeachers = allTeachers.filter(
    (t) =>
      !assignedTeacherIds.includes(t.id) &&
      (t.first_name + " " + t.last_name + " " + t.email).toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const classStudentIds = (studentClass?.students ?? []).map(s => s.student_id);
  const filteredStudents = allStudents.filter(
    (s) =>
      !classStudentIds.includes(s.id) &&
      (s.first_name + " " + s.last_name + " " + s.email).toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Classes</h1>
            <p className="text-sm text-gray-500">{total} total classes in your school</p>
          </div>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(""); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Class
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, grade, or section..."
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
              <th className="text-left px-4 py-3 font-medium text-gray-600">Class</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Grade</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Section</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Academic Year</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Teachers</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Students</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : classes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No classes found. Click "Add Class" to create one.
                </td>
              </tr>
            ) : (
              classes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.grade || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.section || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.academic_year || "—"}</td>
                  <td className="px-4 py-3">
                    {(c.teachers ?? []).length === 0 ? (
                      <span className="text-gray-400 text-xs">No teachers</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(c.teachers ?? []).slice(0, 2).map((t) => (
                          <span key={t.id} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                            {t.teacher.first_name} {t.teacher.last_name}
                          </span>
                        ))}
                        {(c.teachers ?? []).length > 2 && (
                          <span className="text-xs text-gray-400">+{(c.teachers ?? []).length - 2}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(c.students ?? []).length === 0 ? (
                      <span className="text-gray-400 text-xs">No students</span>
                    ) : (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                        {(c.students ?? []).length} students
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openAssign(c)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors">
                        Teachers
                      </button>
                      <button onClick={() => openStudentModal(c)}
                        className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors">
                        Students
                      </button>
                      <button onClick={() => openEdit(c)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id}
                        className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-60">
                        {deletingId === c.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add New Class</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {createError && <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{createError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Class Name *</label>
                <input type="text" placeholder="e.g. Class 6A" value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Grade</label>
                  <input type="text" placeholder="e.g. Grade 6" value={createForm.grade}
                    onChange={(e) => setCreateForm({ ...createForm, grade: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Section</label>
                  <input type="text" placeholder="e.g. A" value={createForm.section}
                    onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
                <input type="text" placeholder="e.g. 2025-2026" value={createForm.academic_year}
                  onChange={(e) => setCreateForm({ ...createForm, academic_year: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={createSubmitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
                {createSubmitting ? "Creating..." : "Create Class"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Edit Class</h2>
              <button onClick={() => setEditClass(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {editError && <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{editError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Class Name *</label>
                <input type="text" value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Grade</label>
                  <input type="text" value={editForm.grade}
                    onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Section</label>
                  <input type="text" value={editForm.section}
                    onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
                <input type="text" value={editForm.academic_year}
                  onChange={(e) => setEditForm({ ...editForm, academic_year: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditClass(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleEdit} disabled={editSubmitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {assignClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Assign Teacher</h2>
                <p className="text-sm text-gray-500">{assignClass.name}</p>
              </div>
              <button onClick={() => setAssignClass(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {(assignClass.teachers ?? []).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Currently Assigned</p>
                <div className="space-y-2">
                  {(assignClass.teachers ?? []).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 font-bold text-xs">
                          {t.teacher.first_name[0]}{t.teacher.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t.teacher.first_name} {t.teacher.last_name}</p>
                          <p className="text-xs text-gray-500">{t.teacher.email}</p>
                        </div>
                      </div>
                      <button onClick={() => handleUnassign(t.teacher.id)} disabled={unassigning === t.teacher.id}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-60">
                        {unassigning === t.teacher.id ? "..." : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Add Teacher</p>
              <input type="text" placeholder="Search teachers..." value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3" />
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {filteredTeachers.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-4">No available teachers.</p>
                ) : (
                  filteredTeachers.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                          {t.first_name[0]}{t.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t.first_name} {t.last_name}</p>
                          <p className="text-xs text-gray-500">{t.email}</p>
                        </div>
                      </div>
                      <button onClick={() => handleAssign(t.id)} disabled={assigning}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-60">
                        Assign
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <button onClick={() => setAssignClass(null)}
              className="mt-4 w-full border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Done</button>
          </div>
        </div>
      )}

      {/* Manage Students Modal */}
      {studentClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Manage Students</h2>
                <p className="text-sm text-gray-500">{studentClass.name}</p>
              </div>
              <button onClick={() => setStudentClass(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {(studentClass.students ?? []).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  In This Class ({(studentClass.students ?? []).length})
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(studentClass.students ?? []).map((s) => (
                    <div key={s.student_id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold text-xs">
                          {s.student.first_name[0]}{s.student.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.student.first_name} {s.student.last_name}</p>
                          <p className="text-xs text-gray-500">{s.student.email}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveStudent(s.student_id)} disabled={removingStudent === s.student_id}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-60">
                        {removingStudent === s.student_id ? "..." : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Add Student</p>
              <input type="text" placeholder="Search students..." value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3" />
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-4">No available students.</p>
                ) : (
                  filteredStudents.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-xs">
                          {s.first_name[0]}{s.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.first_name} {s.last_name}</p>
                          <p className="text-xs text-gray-500">{s.email}</p>
                        </div>
                      </div>
                      <button onClick={() => handleAddStudent(s.id)} disabled={addingStudent}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-60">
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button onClick={() => setStudentClass(null)}
              className="mt-4 w-full border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}