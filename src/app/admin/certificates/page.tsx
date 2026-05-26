"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award, Plus, Trash2, ArrowLeft, Search, CheckCircle,
  XCircle, User, BookOpen, Calendar, Star, Loader2, X, ChevronDown
} from "lucide-react";

interface Certificate {
  id: string;
  student: { id: string; first_name: string; last_name: string; avatar_url: string | null };
  course: { id: string; title: string; thumbnail_url: string | null };
  issuer: { first_name: string; last_name: string; role: string } | null;
  grade: string | null;
  score: number;
  status: string;
  issued_at: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  enrollments: { course_id: string; course: { id: string; title: string } }[];
}

const GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${status === "issued" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
      {status === "issued" ? <span className="flex items-center gap-1"><CheckCircle size={11} /> Issued</span> : <span className="flex items-center gap-1"><XCircle size={11} /> Revoked</span>}
    </span>
  );
}

export default function AdminCertificatesPage() {
  const router = useRouter();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [grade, setGrade] = useState("");
  const [score, setScore] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDrop, setShowStudentDrop] = useState(false);

  useEffect(() => {
    loadCerts();
    fetch("/api/admin/certificates/students")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []));
  }, []);

  const loadCerts = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/certificates");
    const d = await r.json();
    setCerts(d.certificates ?? []);
    setLoading(false);
  };

  const issueCertificate = async () => {
    if (!selectedStudent || !selectedCourse) return;
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: selectedStudent.id, course_id: selectedCourse, grade: grade || null, score: score ? parseInt(score) : 0 }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setShowModal(false);
      resetForm();
      loadCerts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (cert: Certificate) => {
    const newStatus = cert.status === "issued" ? "revoked" : "issued";
    await fetch(`/api/admin/certificates/${cert.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setCerts((prev) => prev.map((c) => c.id === cert.id ? { ...c, status: newStatus } : c));
  };

  const deleteCert = async (id: string) => {
    if (!confirm("Delete this certificate? This cannot be undone.")) return;
    setDeleting(id);
    await fetch(`/api/admin/certificates/${id}`, { method: "DELETE" });
    setCerts((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setSelectedCourse("");
    setGrade("");
    setScore("");
    setStudentSearch("");
    setError("");
  };

  const filtered = certs.filter((c) => {
    const q = search.toLowerCase();
    return (
      `${c.student.first_name} ${c.student.last_name}`.toLowerCase().includes(q) ||
      c.course.title.toLowerCase().includes(q)
    );
  });

  const filteredStudents = students.filter((s) =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Certificates</h1>
            <p className="text-sm text-gray-500">Issue and manage student certificates</p>
          </div>
        </div>
        <button
          onClick={() => { setShowModal(true); resetForm(); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Issue Certificate
        </button>
      </div>

      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-5">
          {[
            { label: "Total Issued", value: certs.filter((c) => c.status === "issued").length, icon: Award, color: "bg-indigo-50", iconColor: "text-indigo-600" },
            { label: "Revoked", value: certs.filter((c) => c.status === "revoked").length, icon: XCircle, color: "bg-red-50", iconColor: "text-red-500" },
            { label: "This Month", value: certs.filter((c) => new Date(c.issued_at).getMonth() === new Date().getMonth()).length, icon: Calendar, color: "bg-emerald-50", iconColor: "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon size={20} className={s.iconColor} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student or course…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
              />
            </div>
            <span className="text-sm text-gray-400">{filtered.length} certificates</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="text-indigo-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Award size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No certificates found</p>
              <p className="text-sm text-gray-400">Issue the first certificate using the button above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Student", "Course", "Grade", "Score", "Issued By", "Date", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                            {cert.student.avatar_url
                              ? <img src={cert.student.avatar_url} className="w-8 h-8 rounded-xl object-cover" alt="" />
                              : `${cert.student.first_name[0]}${cert.student.last_name[0]}`}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{cert.student.first_name} {cert.student.last_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700 max-w-[160px] truncate">{cert.course.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {cert.grade ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
                            <Star size={11} /> {cert.grade}
                          </span>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-gray-800">{cert.score}%</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {cert.issuer ? `${cert.issuer.first_name} ${cert.issuer.last_name}` : "System"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-500">{new Date(cert.issued_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={cert.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStatus(cert)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${cert.status === "issued" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                          >
                            {cert.status === "issued" ? "Revoke" : "Reinstate"}
                          </button>
                          <button
                            onClick={() => deleteCert(cert.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            {deleting === cert.id ? <Loader2 size={14} className="text-red-400 animate-spin" /> : <Trash2 size={14} className="text-red-400" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Issue Certificate Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Award size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Issue Certificate</h2>
                  <p className="text-xs text-gray-400">Manually issue a certificate to a student</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

              {/* Student selector */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Student</label>
                <div className="relative">
                  <div
                    onClick={() => setShowStudentDrop(!showStudentDrop)}
                    className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors text-sm"
                  >
                    {selectedStudent ? (
                      <span className="font-medium text-gray-800">{selectedStudent.first_name} {selectedStudent.last_name}</span>
                    ) : (
                      <span className="text-gray-400">Select a student…</span>
                    )}
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                  {showStudentDrop && (
                    <div className="absolute top-12 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl z-10 overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <input
                          autoFocus
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder="Search students…"
                          className="w-full px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1">
                        {filteredStudents.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">No students found</p>
                        ) : filteredStudents.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => { setSelectedStudent(s); setSelectedCourse(""); setShowStudentDrop(false); }}
                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors"
                          >
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                              {s.first_name[0]}{s.last_name[0]}
                            </div>
                            <span className="text-sm text-gray-700">{s.first_name} {s.last_name}</span>
                            <span className="text-xs text-gray-400 ml-auto">{s.enrollments.length} courses</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Course selector */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={!selectedStudent}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">{selectedStudent ? "Select a course…" : "Select a student first"}</option>
                  {selectedStudent?.enrollments.map((e) => (
                    <option key={e.course_id} value={e.course_id}>{e.course.title}</option>
                  ))}
                </select>
              </div>

              {/* Grade + Score */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Grade <span className="text-gray-400 font-normal">(optional)</span></label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  >
                    <option value="">No grade</option>
                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Score % <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="e.g. 85"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button
                onClick={issueCertificate}
                disabled={!selectedStudent || !selectedCourse || saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Award size={15} />}
                Issue Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
