"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ClassItem {
  id: string;
  name: string;
  grade: string | null;
  section: string | null;
  academic_year: string | null;
  attendance: { student_id: string }[];
  _count: { attendance: number };
  teachers: {
    teacher: {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
  }[];
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  is_active: boolean;
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}

function Avatar({ user, size = 8 }: { user: { first_name: string; last_name: string; avatar_url: string | null }; size?: number }) {
  return user.avatar_url ? (
    <img src={user.avatar_url} className={`w-${size} h-${size} rounded-full object-cover`} alt="" />
  ) : (
    <div className={`w-${size} h-${size} rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs`}>
      {user.first_name[0]}{user.last_name[0]}
    </div>
  );
}

function StudentDrawer({ classId, className, onClose }: { classId: string; className: string; onClose: () => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/teacher/classes/${classId}/students`)
      .then((r) => r.json())
      .then((d) => { setStudents(d.students || []); setLoading(false); });
  }, [classId]);

  const filtered = students.filter((s) =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{className}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{students.length} students</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Students list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">{search ? "No students match search" : "No students in this class yet"}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <div key={s.id} className="px-6 py-4 flex items-center gap-4">
                  <Avatar user={s} size={10} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{s.first_name} {s.last_name}</p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span className="text-green-600">✓ {s.present} present</span>
                      <span className="text-red-500">✗ {s.absent} absent</span>
                      <span className="text-amber-500">~ {s.late} late</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${s.rate >= 75 ? "text-green-600" : s.rate >= 50 ? "text-amber-500" : "text-red-500"}`}>
                      {s.rate}%
                    </p>
                    <p className="text-xs text-gray-400">{s.total} days</p>
                  </div>
                  <div className="w-16">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${s.rate}%`,
                          backgroundColor: s.rate >= 75 ? "#22c55e" : s.rate >= 50 ? "#f59e0b" : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer summary */}
        {!loading && students.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <p className="text-gray-500">Avg Attendance</p>
                <p className="font-bold text-indigo-600 text-base mt-0.5">
                  {Math.round(students.reduce((a, s) => a + s.rate, 0) / students.length)}%
                </p>
              </div>
              <div>
                <p className="text-gray-500">Good (≥75%)</p>
                <p className="font-bold text-green-600 text-base mt-0.5">
                  {students.filter((s) => s.rate >= 75).length}
                </p>
              </div>
              <div>
                <p className="text-gray-500">At Risk (&lt;75%)</p>
                <p className="font-bold text-red-500 text-base mt-0.5">
                  {students.filter((s) => s.rate < 75).length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeacherClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  useEffect(() => {
    fetch("/api/teacher/classes")
      .then((r) => r.json())
      .then((d) => { setClasses(d.classes || []); setLoading(false); });
  }, []);

  const GRADE_COLORS = [
    "bg-indigo-50 border-indigo-200 text-indigo-700",
    "bg-blue-50 border-blue-200 text-blue-700",
    "bg-green-50 border-green-200 text-green-700",
    "bg-amber-50 border-amber-200 text-amber-700",
    "bg-pink-50 border-pink-200 text-pink-700",
    "bg-purple-50 border-purple-200 text-purple-700",
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{classes.length} classes assigned to you</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">🏫</p>
          <p className="text-gray-500 font-medium">No classes assigned yet</p>
          <p className="text-gray-400 text-sm mt-1">Contact your admin to get assigned to a class</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((c, idx) => {
            const colorClass = GRADE_COLORS[idx % GRADE_COLORS.length];
            const studentCount = c.attendance.length;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Color bar */}
                <div className={`h-2 ${colorClass.split(" ")[0].replace("bg-", "bg-").replace("50", "400")}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{c.name}</h3>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {c.grade && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
                            Grade {c.grade}
                          </span>
                        )}
                        {c.section && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Section {c.section}
                          </span>
                        )}
                        {c.academic_year && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {c.academic_year}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Students</p>
                      <p className="font-bold text-gray-800">{studentCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Attendance Records</p>
                      <p className="font-bold text-gray-800">{c._count.attendance}</p>
                    </div>
                  </div>

                  {/* Co-teachers */}
                  {c.teachers.length > 1 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 mb-1.5">Teachers</p>
                      <div className="flex -space-x-2">
                        {c.teachers.slice(0, 4).map((t) => (
                          <Avatar key={t.teacher.id} user={t.teacher} size={7} />
                        ))}
                        {c.teachers.length > 4 && (
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium">
                            +{c.teachers.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedClass(c)}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      View Students
                    </button>
                    <button
                      onClick={() => router.push(`/teacher/attendance?class=${c.id}`)}
                      className="flex-1 border border-indigo-200 text-indigo-600 py-2 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors"
                    >
                      Attendance
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Drawer */}
      {selectedClass && (
        <StudentDrawer
          classId={selectedClass.id}
          className={selectedClass.name}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </div>
  );
}