"use client";

import React, { useEffect, useState } from "react";
import {
  Brain, Sparkles, Users, FileText, ClipboardCheck,
  RefreshCw, ChevronDown, AlertCircle, CheckCircle,
  TrendingUp, TrendingDown, Zap, BookOpen, HelpCircle,
  ClipboardList, Loader2, Copy, Check, BarChart3,
  AlertTriangle, Target
} from "lucide-react";
import BackButton from "@/components/BackButton";

type Tab = "analytics" | "generator" | "grader";
type ContentType = "lesson" | "quiz" | "assignment";

interface StudentStat {
  studentId: string;
  name: string;
  grade: string | null;
  avgScore: number;
  quizAttempts: number;
  completedLessons: number;
  status: "on-track" | "needs-attention" | "at-risk";
}

interface Course { id: string; title: string; subject: string | null; }

export default function TeacherAIPage() {
  const [tab, setTab] = useState<Tab>("analytics");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {toast.msg}
        </div>
      )}

      <BackButton href="/teacher/dashboard" />

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Brain size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Teaching Hub</h1>
          <p className="text-gray-500 text-sm mt-0.5">Powered by LLaMA 3.3 70B — Ask anything, generate anything</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 w-fit shadow-sm">
        {([
          { key: "analytics", label: "Class Analytics", icon: <BarChart3 size={15} /> },
          { key: "generator", label: "Content Generator", icon: <Sparkles size={15} /> },
          { key: "grader", label: "AI Grader", icon: <ClipboardCheck size={15} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "analytics" && <ClassAnalyticsTab showToast={showToast} />}
      {tab === "generator" && <ContentGeneratorTab showToast={showToast} />}
      {tab === "grader" && <AIGraderTab showToast={showToast} />}
    </div>
  );
}

// ── CLASS ANALYTICS TAB ────────────────────────────────────────────────────
function ClassAnalyticsTab({ showToast }: { showToast: (msg: string, type?: "success" | "error") => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  async function fetchAnalytics(courseId?: string) {
    setLoading(true);
    const res = await fetch("/api/teacher/ai/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "classAnalytics", courseId: courseId || selectedCourse }),
    });
    const d = await res.json();
    if (d.error) { showToast(d.error, "error"); setLoading(false); return; }
    setData(d);
    if (d.selectedCourse) setSelectedCourse(d.selectedCourse);
    setLoading(false);
  }

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 flex-col gap-3">
      <Loader2 size={28} className="text-indigo-500 animate-spin" />
      <p className="text-gray-400 text-sm">AI is analyzing your class...</p>
    </div>
  );

  if (!data || !data.courses) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
      <Users size={40} className="text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500">No courses found. Create a course first.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Course selector */}
      <div className="flex items-center gap-3">
        <select value={selectedCourse} onChange={(e) => { setSelectedCourse(e.target.value); fetchAnalytics(e.target.value); }}
          className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 shadow-sm">
          {data.courses.map((c: Course) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <button onClick={() => fetchAnalytics()} className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md text-gray-600 transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: data.totalStudents, icon: <Users size={18} />, color: "text-indigo-600 bg-indigo-50" },
          { label: "Class Average", value: `${data.classAvg}%`, icon: <BarChart3 size={18} />, color: data.classAvg >= 70 ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50" },
          { label: "On Track", value: data.onTrackCount, icon: <TrendingUp size={18} />, color: "text-emerald-600 bg-emerald-50" },
          { label: "At Risk", value: data.atRiskCount, icon: <AlertTriangle size={18} />, color: "text-red-500 bg-red-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-gray-900 font-bold text-xl">{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      {data.aiInsights && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-yellow-300" />
            <span className="text-white/80 text-xs font-semibold uppercase tracking-wide">AI Class Insights</span>
          </div>
          <p className="text-white text-sm mb-4">{data.aiInsights.summary}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-white/70 text-xs font-semibold mb-2">KEY INSIGHTS</p>
              <ul className="space-y-1.5">
                {data.aiInsights.topInsights?.map((insight: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                    <CheckCircle size={13} className="text-emerald-300 shrink-0 mt-0.5" /> {insight}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold mb-2">RECOMMENDATIONS</p>
              <ul className="space-y-1.5">
                {data.aiInsights.recommendations?.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                    <Target size={13} className="text-yellow-300 shrink-0 mt-0.5" /> {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {data.aiInsights.nextSteps && (
            <div className="mt-4 p-3 bg-white/10 rounded-xl">
              <p className="text-white/70 text-xs font-semibold mb-1">NEXT STEPS</p>
              <p className="text-white text-sm">{data.aiInsights.nextSteps}</p>
            </div>
          )}
        </div>
      )}

      {/* Student table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-gray-900 font-semibold text-sm">Student Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3">Student</th>
                <th className="text-left px-6 py-3">Grade</th>
                <th className="text-left px-6 py-3">Avg Score</th>
                <th className="text-left px-6 py-3">Lessons Done</th>
                <th className="text-left px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.studentStats?.map((s: StudentStat) => (
                <tr key={s.studentId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {s.name.charAt(0)}
                      </div>
                      <span className="text-gray-900 font-medium text-sm">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{s.grade ?? "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${s.avgScore >= 70 ? "bg-emerald-500" : s.avgScore >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${s.avgScore}%` }} />
                      </div>
                      <span className={`text-sm font-medium ${s.avgScore >= 70 ? "text-emerald-600" : s.avgScore >= 50 ? "text-amber-600" : "text-red-600"}`}>
                        {s.avgScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{s.completedLessons}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${s.status === "on-track" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : s.status === "needs-attention" ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                      {s.status.replace("-", " ")}
                    </span>
                  </td>
                </tr>
              ))}
              {(!data.studentStats || data.studentStats.length === 0) && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">No students enrolled yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── CONTENT GENERATOR TAB ─────────────────────────────────────────────────
function ContentGeneratorTab({ showToast }: { showToast: (msg: string, type?: "success" | "error") => void }) {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("General");
  const [gradeLevel, setGradeLevel] = useState("High School");
  const [contentType, setContentType] = useState<ContentType>("lesson");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!topic.trim()) { showToast("Enter a topic first", "error"); return; }
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/teacher/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "generate", topic, subject, gradeLevel, contentType }),
    });
    const d = await res.json();
    if (d.error) { showToast(d.error, "error"); setLoading(false); return; }
    setResult(d.result);
    setLoading(false);
    showToast("Content generated!");
  }

  function copyResult() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Input form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-600" /> Generate Educational Content
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500 font-medium mb-1.5 block">Topic *</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, World War 2, Quadratic Equations, Python loops..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1.5 block">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Mathematics, Science..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1.5 block">Grade Level</label>
            <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400">
              {["Primary (Grade 1-5)", "Middle School (Grade 6-8)", "High School (Grade 9-12)", "O-Level", "A-Level", "University"].map(g => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          {([
            { key: "lesson", label: "Lesson Plan", icon: <BookOpen size={14} /> },
            { key: "quiz", label: "Quiz", icon: <HelpCircle size={14} /> },
            { key: "assignment", label: "Assignment", icon: <ClipboardList size={14} /> },
          ] as { key: ContentType; label: string; icon: React.ReactNode }[]).map((t) => (
            <button key={t.key} onClick={() => setContentType(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${contentType === t.key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <button onClick={generate} disabled={loading || !topic.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
          {loading ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><Sparkles size={15} /> Generate</>}
        </button>
      </div>

      {/* Result */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Loader2 size={32} className="text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">AI is creating your {contentType}...</p>
        </div>
      )}

      {result && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-gray-900 font-semibold">{result.title}</h3>
            <button onClick={copyResult}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
              {copied ? <><Check size={13} className="text-emerald-500" /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>

          {contentType === "lesson" && result.mainContent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-indigo-50 rounded-xl p-3">
                  <p className="text-xs text-indigo-500 font-semibold mb-1">OBJECTIVE</p>
                  <p className="text-sm text-indigo-900">{result.objective}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-semibold mb-1">DURATION</p>
                  <p className="text-sm text-gray-700">{result.duration}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-2">INTRODUCTION</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{result.introduction}</p>
              </div>
              {result.mainContent.map((section: any, i: number) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">{section.section}</p>
                  <p className="text-sm text-gray-600 mb-2">{section.content}</p>
                  <div className="bg-amber-50 rounded-lg p-2.5">
                    <p className="text-xs text-amber-600 font-semibold mb-1">ACTIVITY</p>
                    <p className="text-xs text-amber-800">{section.activity}</p>
                  </div>
                </div>
              ))}
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs text-emerald-600 font-semibold mb-1">HOMEWORK</p>
                <p className="text-sm text-emerald-800">{result.homework}</p>
              </div>
            </div>
          )}

          {contentType === "quiz" && result.questions && (
            <div className="space-y-4">
              {result.questions.map((q: any, i: number) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">Q{i + 1}. {q.question}</p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {q.options.map((opt: string, j: number) => (
                      <div key={j} className={`text-xs px-3 py-2 rounded-lg ${opt.startsWith(q.correct) ? "bg-emerald-50 text-emerald-700 font-medium border border-emerald-200" : "bg-gray-50 text-gray-600"}`}>
                        {opt}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 italic">{q.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {contentType === "assignment" && result.tasks && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{result.description}</p>
              <div className="space-y-3">
                {result.tasks.map((task: any, i: number) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">Task {i + 1}: {task.task}</p>
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">{task.marks} marks</span>
                    </div>
                    <p className="text-sm text-gray-600">{task.instructions}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 font-semibold mb-1">RUBRIC</p>
                <p className="text-sm text-gray-700">{result.rubric}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI GRADER TAB ─────────────────────────────────────────────────────────
function AIGraderTab({ showToast }: { showToast: (msg: string, type?: "success" | "error") => void }) {
  const [submission, setSubmission] = useState("");
  const [rubric, setRubric] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function grade() {
    if (!submission.trim()) { showToast("Paste student submission first", "error"); return; }
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/teacher/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "grade", submission, rubric, maxMarks: parseInt(maxMarks), assignmentTitle }),
    });
    const d = await res.json();
    if (d.error) { showToast(d.error, "error"); setLoading(false); return; }
    setResult(d.result);
    setLoading(false);
    showToast("Grading complete!");
  }

  const gradeColor = result ? (result.percentage >= 70 ? "text-emerald-600" : result.percentage >= 50 ? "text-amber-600" : "text-red-600") : "";
  const gradeBg = result ? (result.percentage >= 70 ? "from-emerald-500 to-emerald-600" : result.percentage >= 50 ? "from-amber-500 to-amber-600" : "from-red-500 to-red-600") : "";

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
          <ClipboardCheck size={16} className="text-indigo-600" /> AI Assignment Grader
        </h3>
        <p className="text-gray-400 text-xs mb-4">Paste a student's submission and optionally provide a rubric. The AI will score it and provide detailed feedback.</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1.5 block">Assignment Title</label>
            <input value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)}
              placeholder="Essay on Climate Change"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1.5 block">Max Marks</label>
            <input value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} type="number"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-gray-500 font-medium mb-1.5 block">Grading Rubric (optional)</label>
          <textarea value={rubric} onChange={(e) => setRubric(e.target.value)} rows={3}
            placeholder="e.g. Content accuracy (40%), Analysis depth (30%), Writing quality (20%), References (10%)"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
        </div>

        <div className="mb-4">
          <label className="text-xs text-gray-500 font-medium mb-1.5 block">Student Submission *</label>
          <textarea value={submission} onChange={(e) => setSubmission(e.target.value)} rows={8}
            placeholder="Paste the student's submission here..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
        </div>

        <button onClick={grade} disabled={loading || !submission.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
          {loading ? <><Loader2 size={15} className="animate-spin" /> Grading...</> : <><ClipboardCheck size={15} /> Grade Submission</>}
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Loader2 size={32} className="text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">AI is reading and grading the submission...</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Score card */}
          <div className={`bg-gradient-to-r ${gradeBg} rounded-2xl p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">AI Grade</p>
                <p className="text-5xl font-bold">{result.grade}</p>
                <p className="text-white/80 text-sm mt-1">{result.score} / {maxMarks} marks ({result.percentage}%)</p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                <ClipboardCheck size={36} className="text-white" />
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h4 className="text-gray-900 font-semibold mb-3">Detailed Feedback</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{result.detailedFeedback}</p>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={15} className="text-emerald-500" />
                <h4 className="text-gray-900 font-semibold text-sm">Strengths</h4>
              </div>
              <ul className="space-y-2">
                {result.strengths?.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={15} className="text-amber-500" />
                <h4 className="text-gray-900 font-semibold text-sm">Areas to Improve</h4>
              </div>
              <ul className="space-y-2">
                {result.improvements?.map((imp: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" /> {imp}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Rubric breakdown */}
          {result.rubricBreakdown && result.rubricBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h4 className="text-gray-900 font-semibold mb-4">Rubric Breakdown</h4>
              <div className="space-y-3">
                {result.rubricBreakdown.map((rb: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{rb.criterion}</span>
                        <span className="text-sm font-bold text-gray-900">{rb.score}/{rb.maxScore}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                        <div className="h-1.5 rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${(rb.score / rb.maxScore) * 100}%` }} />
                      </div>
                      <p className="text-xs text-gray-400">{rb.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}