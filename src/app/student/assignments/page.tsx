"use client";
import { useEffect, useState } from "react";
import { ClipboardList, Clock, CheckCircle, AlertCircle, XCircle, ChevronRight, Search, FileText, Star } from "lucide-react";
import StudentSidebar from "@/components/student/StudentSidebar";

interface Submission {
  id: string;
  status: string;
  marks: number | null;
  feedback: string | null;
  text_answer: string | null;
  file_url: string | null;
  submitted_at: string;
  graded_at: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_marks: number;
  course_title: string;
  course_subject: string | null;
  submission: Submission | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  submitted: { label: "Submitted", color: "bg-blue-50 text-blue-600 border-blue-100", icon: CheckCircle },
  graded: { label: "Graded", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: Star },
  late: { label: "Late", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
  missing: { label: "Missing", color: "bg-red-50 text-red-600 border-red-100", icon: XCircle },
  pending: { label: "Pending", color: "bg-gray-50 text-gray-600 border-gray-100", icon: ClipboardList },
};

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "graded">("all");
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    const res = await fetch("/api/student/assignments");
    const data = await res.json();
    setAssignments(data.assignments || []);
    setLoading(false);
  }

  function getStatus(a: Assignment) {
    if (!a.submission) {
      return new Date() > new Date(a.due_date) ? "missing" : "pending";
    }
    return a.submission.status;
  }

  function isOverdue(a: Assignment) {
    return new Date() > new Date(a.due_date) && !a.submission;
  }

  async function submitAssignment() {
    if (!selected || !textAnswer.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/student/assignments/${selected.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text_answer: textAnswer }),
    });
    const data = await res.json();
    if (data.submission) {
      setSubmitSuccess(true);
      await fetchAssignments();
      setTimeout(() => {
        setSelected(null);
        setTextAnswer("");
        setSubmitSuccess(false);
      }, 1500);
    }
    setSubmitting(false);
  }

  const filtered = assignments.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.course_title.toLowerCase().includes(search.toLowerCase());
    const status = getStatus(a);
    const matchFilter = filter === "all" ? true : filter === "pending" ? status === "pending" || status === "missing" : status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => !a.submission && new Date() < new Date(a.due_date)).length,
    submitted: assignments.filter(a => a.submission?.status === "submitted" || a.submission?.status === "late").length,
    graded: assignments.filter(a => a.submission?.status === "graded").length,
    missing: assignments.filter(a => isOverdue(a)).length,
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar active="assignments" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
            <p className="text-gray-500 mt-1">Submit and track your assignments</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total", value: stats.total, color: "indigo" },
              { label: "Pending", value: stats.pending, color: "amber" },
              { label: "Submitted", value: stats.submitted, color: "blue" },
              { label: "Graded", value: stats.graded, color: "emerald" },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assignments..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" />
            </div>
            {(["all", "pending", "submitted", "graded"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === f ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Assignments list */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 border border-gray-100 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No assignments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(a => {
                const status = getStatus(a);
                const cfg = statusConfig[status] || statusConfig.pending;
                const Icon = cfg.icon;
                const overdue = isOverdue(a);
                return (
                  <div
                    key={a.id}
                    onClick={() => { setSelected(a); setTextAnswer(a.submission?.text_answer || ""); }}
                    className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer p-5 flex items-center gap-4 ${overdue ? "border-red-100" : "border-gray-100"}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${overdue ? "bg-red-50" : "bg-indigo-50"}`}>
                      <ClipboardList size={20} className={overdue ? "text-red-500" : "text-indigo-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 truncate">{a.title}</p>
                        <span className={`shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{a.course_title} {a.course_subject && `· ${a.course_subject}`}</p>
                      <div className="flex items-center gap-4 mt-1.5">
                        <span className={`flex items-center gap-1 text-xs ${overdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                          <Clock size={11} /> Due {new Date(a.due_date).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-400">Max {a.max_marks} marks</span>
                        {a.submission?.marks !== null && a.submission?.marks !== undefined && (
                          <span className="text-xs font-semibold text-emerald-600">Score: {a.submission.marks}/{a.max_marks}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{selected.course_title}</p>
                </div>
                <button onClick={() => { setSelected(null); setTextAnswer(""); setSubmitSuccess(false); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Info row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Due Date</p>
                  <p className="text-sm font-semibold text-gray-900">{new Date(selected.due_date).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Max Marks</p>
                  <p className="text-sm font-semibold text-gray-900">{selected.max_marks}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{getStatus(selected)}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Instructions</p>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">{selected.description}</p>
              </div>

              {/* Feedback if graded */}
              {selected.submission?.status === "graded" && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-emerald-700">Graded</p>
                    <span className="text-lg font-bold text-emerald-600">{selected.submission.marks}/{selected.max_marks}</span>
                  </div>
                  {selected.submission.feedback && (
                    <p className="text-sm text-emerald-700">{selected.submission.feedback}</p>
                  )}
                </div>
              )}

              {/* Submission area */}
              {selected.submission?.status !== "graded" && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {selected.submission ? "Your Submission" : "Submit Answer"}
                  </p>
                  <textarea
                    value={textAnswer}
                    onChange={e => setTextAnswer(e.target.value)}
                    disabled={!!selected.submission && selected.submission.status !== "late"}
                    rows={6}
                    placeholder="Type your answer here..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 resize-none disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  {(!selected.submission || selected.submission.status === "late") && (
                    <button
                      onClick={submitAssignment}
                      disabled={submitting || !textAnswer.trim() || submitSuccess}
                      className={`mt-3 w-full py-3 rounded-xl text-sm font-medium transition-all ${submitSuccess ? "bg-emerald-500 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-200 disabled:text-gray-400"}`}
                    >
                      {submitSuccess ? "✓ Submitted!" : submitting ? "Submitting..." : selected.submission ? "Resubmit" : "Submit Assignment"}
                    </button>
                  )}
                </div>
              )}

              {/* Already submitted info */}
              {selected.submission && selected.submission.status !== "graded" && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-600">Submitted on {new Date(selected.submission.submitted_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}