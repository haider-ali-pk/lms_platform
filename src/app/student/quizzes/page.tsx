"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, Clock, CheckCircle, XCircle, Trophy, ChevronRight, Search, AlertCircle } from "lucide-react";
import StudentSidebar from "@/components/student/StudentSidebar";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit: number | null;
  pass_mark: number;
  max_attempts: number;
  course_title: string;
  course_subject: string | null;
  total_questions: number;
  attempts_used: number;
  best_score: number | null;
  can_attempt: boolean;
  last_attempt: { score: number; passed: boolean; submitted_at: string } | null;
}

export default function StudentQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "completed">("all");

  useEffect(() => {
    fetch("/api/student/quizzes").then(r => r.json()).then(d => {
      setQuizzes(d.quizzes || []);
      setLoading(false);
    });
  }, []);

  const filtered = quizzes.filter(q => {
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase()) || q.course_title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ? true : filter === "available" ? q.can_attempt : !q.can_attempt;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: quizzes.length,
    available: quizzes.filter(q => q.can_attempt).length,
    passed: quizzes.filter(q => q.last_attempt?.passed).length,
    avgScore: quizzes.filter(q => q.best_score !== null).length > 0
      ? Math.round(quizzes.filter(q => q.best_score !== null).reduce((sum, q) => sum + (q.best_score || 0), 0) / quizzes.filter(q => q.best_score !== null).length)
      : 0,
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar active="quizzes" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
            <p className="text-gray-500 mt-1">Test your knowledge and track your scores</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Quizzes", value: stats.total, color: "indigo", icon: HelpCircle },
              { label: "Available", value: stats.available, color: "amber", icon: AlertCircle },
              { label: "Passed", value: stats.passed, color: "emerald", icon: CheckCircle },
              { label: "Avg Score", value: `${stats.avgScore}%`, color: "violet", icon: Trophy },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-${s.color}-50 shrink-0`}>
                  <s.icon size={20} className={`text-${s.color}-600`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search quizzes..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" />
            </div>
            {(["all", "available", "completed"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === f ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Quiz list */}
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 border border-gray-100 animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16"><HelpCircle size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No quizzes found</p></div>
          ) : (
            <div className="space-y-3">
              {filtered.map(q => (
                <div
                  key={q.id}
                  onClick={() => q.can_attempt || q.attempts_used > 0 ? router.push(`/student/quizzes/${q.id}`) : null}
                  className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4 ${q.can_attempt ? "cursor-pointer border-gray-100" : "cursor-default border-gray-100 opacity-75"}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${q.last_attempt?.passed ? "bg-emerald-50" : q.can_attempt ? "bg-indigo-50" : "bg-gray-50"}`}>
                    {q.last_attempt?.passed ? <Trophy size={22} className="text-emerald-500" /> : <HelpCircle size={22} className={q.can_attempt ? "text-indigo-500" : "text-gray-400"} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 truncate">{q.title}</p>
                      {q.last_attempt?.passed && <span className="shrink-0 text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">Passed</span>}
                      {q.last_attempt && !q.last_attempt.passed && <span className="shrink-0 text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full font-medium">Failed</span>}
                      {!q.can_attempt && <span className="shrink-0 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">No attempts left</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{q.course_title}{q.course_subject && ` · ${q.course_subject}`}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><HelpCircle size={11} /> {q.total_questions} questions</span>
                      {q.time_limit && <span className="flex items-center gap-1"><Clock size={11} /> {q.time_limit} min</span>}
                      <span>Pass: {q.pass_mark}%</span>
                      <span>{q.attempts_used}/{q.max_attempts} attempts</span>
                      {q.best_score !== null && <span className="font-semibold text-indigo-600">Best: {q.best_score}%</span>}
                    </div>
                  </div>
                  {(q.can_attempt || q.attempts_used > 0) && <ChevronRight size={16} className="text-gray-300 shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
