"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────
interface ClassItem { id: string; name: string; grade?: string; section?: string }
interface StudentItem { id: string; first_name: string; last_name: string; avatar_url?: string }
interface Summary { present: number; absent: number; late: number; excused: number; total: number }
interface DailyPoint { date: string; present: number; absent: number; late: number; excused: number }
interface StudentRow { student: StudentItem; present: number; absent: number; late: number; excused: number; total: number }
interface AttendanceRecord { id: string; date: string; status: string; note?: string; class: ClassItem }

const STATUS_COLORS: Record<string, string> = {
  present: "#22c55e",
  absent:  "#ef4444",
  late:    "#f59e0b",
  excused: "#6366f1",
};

const PIE_COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#6366f1"];

function Avatar({ user, size = 8 }: { user: StudentItem; size?: number }) {
  return user.avatar_url ? (
    <img
      src={user.avatar_url}
      className={`w-${size} h-${size} rounded-full object-cover`}
      alt=""
    />
  ) : (
    <div
      className={`w-${size} h-${size} rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs`}
    >
      {user.first_name[0]}{user.last_name[0]}
    </div>
  );
}

function SummaryCards({ summary }: { summary: Summary }) {
  const rate = summary.total > 0
    ? Math.round((summary.present / summary.total) * 100)
    : 0;
  const cards = [
    { label: "Total Records", value: summary.total, color: "bg-gray-50 border-gray-200", text: "text-gray-700" },
    { label: "Present", value: summary.present, color: "bg-green-50 border-green-200", text: "text-green-700" },
    { label: "Absent", value: summary.absent, color: "bg-red-50 border-red-200", text: "text-red-700" },
    { label: "Late", value: summary.late, color: "bg-amber-50 border-amber-200", text: "text-amber-700" },
    { label: "Excused", value: summary.excused, color: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
    { label: "Attendance Rate", value: `${rate}%`, color: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
          <p className="text-xs text-gray-500 mb-1">{c.label}</p>
          <p className={`text-2xl font-bold ${c.text}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    present: "bg-green-100 text-green-700",
    absent:  "bg-red-100 text-red-700",
    late:    "bg-amber-100 text-amber-700",
    excused: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

// ── Class View ─────────────────────────────────────────────────────────
function ClassView() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetch("/api/admin/attendance?view=class")
      .then((r) => r.json())
      .then((d) => setClasses(d.classes || []));
  }, []);

  const fetchReport = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    setSearched(true);
    const params = new URLSearchParams({ view: "class", class_id: selectedClass });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/admin/attendance?${params}`);
    const data = await res.json();
    setSummary(data.summary || null);
    setStudents(data.students || []);
    setDaily(data.daily || []);
    setLoading(false);
  }, [selectedClass, from, to]);

  const pieData = summary
    ? [
        { name: "Present", value: summary.present },
        { name: "Absent",  value: summary.absent },
        { name: "Late",    value: summary.late },
        { name: "Excused", value: summary.excused },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Filter by Class & Date Range</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.grade ? ` — Grade ${c.grade}` : ""}{c.section ? ` (${c.section})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={!selectedClass || loading}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading…" : "Generate Report"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && searched && summary && (
        <>
          <SummaryCards summary={summary} />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily trend */}
            {daily.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Attendance Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={daily} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="present" fill="#22c55e" name="Present" stackId="a" />
                    <Bar dataKey="absent"  fill="#ef4444" name="Absent"  stackId="a" />
                    <Bar dataKey="late"    fill="#f59e0b" name="Late"    stackId="a" />
                    <Bar dataKey="excused" fill="#6366f1" name="Excused" stackId="a" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pie */}
            {pieData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Breakdown</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <ResponsiveContainer width="100%" height={220}>
  <PieChart>
    <Pie
      data={pieData}
      cx="50%"
      cy="50%"
      outerRadius={80}
      dataKey="value"
      labelLine={false}
      label={({ name, percent }) => `${String(name)} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`}
    >
      {pieData.map((_entry, i) => (
        <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
      ))}
    </Pie>
    <Legend />
    <Tooltip />
  </PieChart>
</ResponsiveContainer>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Per-student table */}
          {students.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Per-Student Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-5 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-center">Present</th>
                      <th className="px-4 py-3 text-center">Absent</th>
                      <th className="px-4 py-3 text-center">Late</th>
                      <th className="px-4 py-3 text-center">Excused</th>
                      <th className="px-4 py-3 text-center">Total</th>
                      <th className="px-4 py-3 text-center">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students
                      .sort((a, b) => b.absent - a.absent)
                      .map((row) => {
                        const rate = row.total > 0
                          ? Math.round((row.present / row.total) * 100)
                          : 0;
                        return (
                          <tr key={row.student.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar user={row.student} />
                                <span className="font-medium text-gray-800">
                                  {row.student.first_name} {row.student.last_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-green-700 font-medium">{row.present}</td>
                            <td className="px-4 py-3 text-center text-red-600 font-medium">{row.absent}</td>
                            <td className="px-4 py-3 text-center text-amber-600 font-medium">{row.late}</td>
                            <td className="px-4 py-3 text-center text-indigo-600 font-medium">{row.excused}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{row.total}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="h-1.5 rounded-full"
                                    style={{
                                      width: `${rate}%`,
                                      backgroundColor: rate >= 75 ? "#22c55e" : rate >= 50 ? "#f59e0b" : "#ef4444",
                                    }}
                                  />
                                </div>
                                <span className={`text-xs font-medium ${rate >= 75 ? "text-green-700" : rate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                                  {rate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {summary.total === 0 && (
            <div className="text-center py-12 text-gray-400">No attendance records found for this selection.</div>
          )}
        </>
      )}

      {!loading && !searched && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">Select a class and click Generate Report</p>
        </div>
      )}
    </div>
  );
}

// ── Student View ───────────────────────────────────────────────────────
function StudentView() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    fetch("/api/admin/attendance?view=student")
      .then((r) => r.json())
      .then((d) => {
        setStudents(d.students || []);
        setFilteredStudents(d.students || []);
        setLoadingStudents(false);
      });
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredStudents(
      students.filter((s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q)
      )
    );
  }, [search, students]);

  const fetchStudentReport = useCallback(async (student: StudentItem) => {
    setSelectedStudent(student);
    setLoading(true);
    const params = new URLSearchParams({ view: "student", student_id: student.id });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/admin/attendance?${params}`);
    const data = await res.json();
    setSummary(data.summary || null);
    setRecords(data.records || []);
    setLoading(false);
  }, [from, to]);

  const reloadWithDates = () => {
    if (selectedStudent) fetchStudentReport(selectedStudent);
  };

  const pieData = summary
    ? [
        { name: "Present", value: summary.present },
        { name: "Absent",  value: summary.absent },
        { name: "Late",    value: summary.late },
        { name: "Excused", value: summary.excused },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Student list sidebar */}
      <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search student…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {loadingStudents && (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loadingStudents && filteredStudents.map((s) => (
            <button
              key={s.id}
              onClick={() => fetchStudentReport(s)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 transition-colors ${selectedStudent?.id === s.id ? "bg-indigo-50 border-l-4 border-indigo-600" : ""}`}
            >
              <Avatar user={s} size={8} />
              <span className={`text-sm font-medium ${selectedStudent?.id === s.id ? "text-indigo-700" : "text-gray-700"}`}>
                {s.first_name} {s.last_name}
              </span>
            </button>
          ))}
          {!loadingStudents && filteredStudents.length === 0 && (
            <p className="text-center py-6 text-sm text-gray-400">No students found</p>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 space-y-5">
        {/* Date filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {selectedStudent && (
              <button
                onClick={reloadWithDates}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Apply Filter
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && !selectedStudent && (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-sm">Select a student from the list</p>
          </div>
        )}

        {!loading && selectedStudent && summary && (
          <>
            {/* Student header */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <Avatar user={selectedStudent} size={12} />
              <div>
                <p className="font-semibold text-gray-800 text-lg">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </p>
                <p className="text-sm text-gray-500">Attendance Report</p>
              </div>
            </div>

            <SummaryCards summary={summary} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Pie */}
              {pieData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Breakdown</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${String(name)} ${(((percent ?? 0) as number) * 100).toFixed(0)}%`} labelLine={false}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Records table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">Attendance History</h3>
                </div>
                <div className="overflow-y-auto max-h-[220px]">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Class</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {records.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700">
                            {new Date(r.date).toLocaleDateString("en-PK", {
                              day: "2-digit", month: "short", year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-2 text-gray-600">{r.class.name}</td>
                          <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                        </tr>
                      ))}
                      {records.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-6 text-gray-400 text-xs">No records found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function AttendanceAnalyticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"class" | "student">("class");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and analyze attendance reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit mb-6">
        {(["class", "student"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:text-indigo-600"
            }`}
          >
            {tab === "class" ? "📋 By Class" : "👤 By Student"}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "class" ? <ClassView /> : <StudentView />}
    </div>
  );
}