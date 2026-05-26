"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudentSidebar from "@/components/student/StudentSidebar";
import {
  TrendingUp, BookOpen, CheckCircle, ClipboardList, HelpCircle,
  ArrowLeft, Trophy, Target, Flame, Star
} from "lucide-react";

interface ProgressData {
  overallPercent: number;
  totalCourses: number;
  completedCourses: number;
  totalAssignments: number;
  gradedAssignments: number;
  avgAssignmentScore: number;
  totalQuizzes: number;
  avgQuizScore: number;
  courseProgress: {
    courseId: string;
    title: string;
    thumbnail: string | null;
    totalLessons: number;
    completedLessons: number;
    percent: number;
    enrolledAt: string;
    completedAt: string | null;
  }[];
  recentAssignments: {
    title: string;
    status: string;
    marks: number | null;
    total: number | null;
    submittedAt: string;
  }[];
  recentQuizzes: {
    title: string;
    score: number | null;
    total: number | null;
    completedAt: string;
  }[];
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function ScoreRing({ percent }: { percent: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 75 ? "#10b981" : percent >= 50 ? "#f59e0b" : "#4F46E5";
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
      <circle
        cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 65 65)"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text x="65" y="60" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#111827">{percent}%</text>
      <text x="65" y="78" textAnchor="middle" fontSize="11" fill="#9ca3af">Overall</text>
    </svg>
  );
}

function ProgressBar({ percent, color = "bg-indigo-500" }: { percent: number; color?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all duration-700`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    graded: "bg-emerald-100 text-emerald-700",
    submitted: "bg-blue-100 text-blue-700",
    late: "bg-amber-100 text-amber-700",
    missing: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function ProgressPage() {
  const router = useRouter();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/student/progress")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load progress"); setLoading(false); });
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar active="progress" />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Progress</h1>
            <p className="text-sm text-gray-500">Track your learning journey across all courses</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {loading && (
            <div className="grid grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 rounded-2xl p-5 text-sm">{error}</div>
          )}

          {data && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard
                  icon={<TrendingUp size={20} className="text-indigo-600" />}
                  label="Overall Progress"
                  value={`${data.overallPercent}%`}
                  sub="Across all enrolled courses"
                  color="bg-indigo-50"
                />
                <StatCard
                  icon={<BookOpen size={20} className="text-emerald-600" />}
                  label="Courses Completed"
                  value={`${data.completedCourses}/${data.totalCourses}`}
                  sub="Fully finished courses"
                  color="bg-emerald-50"
                />
                <StatCard
                  icon={<ClipboardList size={20} className="text-amber-600" />}
                  label="Avg Assignment Score"
                  value={`${data.avgAssignmentScore}%`}
                  sub={`${data.gradedAssignments} of ${data.totalAssignments} graded`}
                  color="bg-amber-50"
                />
                <StatCard
                  icon={<HelpCircle size={20} className="text-purple-600" />}
                  label="Avg Quiz Score"
                  value={`${data.avgQuizScore}%`}
                  sub={`${data.totalQuizzes} quizzes attempted`}
                  color="bg-purple-50"
                />
              </div>

              {/* Overall ring + course breakdown */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Ring */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center gap-4">
                  <ScoreRing percent={data.overallPercent} />
                  <div className="w-full space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1"><Flame size={14} className="text-amber-500" /> Assignments</span>
                      <span className="font-semibold text-gray-800">{data.avgAssignmentScore}%</span>
                    </div>
                    <ProgressBar percent={data.avgAssignmentScore} color="bg-amber-400" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1"><Star size={14} className="text-purple-500" /> Quizzes</span>
                      <span className="font-semibold text-gray-800">{data.avgQuizScore}%</span>
                    </div>
                    <ProgressBar percent={data.avgQuizScore} color="bg-purple-400" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1"><Target size={14} className="text-indigo-500" /> Courses</span>
                      <span className="font-semibold text-gray-800">{data.overallPercent}%</span>
                    </div>
                    <ProgressBar percent={data.overallPercent} color="bg-indigo-400" />
                  </div>
                </div>

                {/* Course Progress List */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <BookOpen size={18} className="text-indigo-500" /> Course Progress
                  </h2>
                  {data.courseProgress.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No courses enrolled yet.</p>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                      {data.courseProgress.map((c) => (
                        <div key={c.courseId} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                            {c.thumbnail ? (
                              <img src={c.thumbnail} alt={c.title} className="w-10 h-10 rounded-xl object-cover" />
                            ) : (
                              <BookOpen size={18} className="text-indigo-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold text-gray-800 truncate">{c.title}</p>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {c.completedAt && (
                                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                    <CheckCircle size={12} /> Done
                                  </span>
                                )}
                                <span className="text-sm font-bold text-indigo-600">{c.percent}%</span>
                              </div>
                            </div>
                            <ProgressBar
                              percent={c.percent}
                              color={c.percent === 100 ? "bg-emerald-500" : "bg-indigo-500"}
                            />
                            <p className="text-xs text-gray-400 mt-1">{c.completedLessons}/{c.totalLessons} lessons completed</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Assignments + Quizzes */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Assignments */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <ClipboardList size={18} className="text-amber-500" /> Recent Assignments
                  </h2>
                  {data.recentAssignments.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No assignments submitted yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.recentAssignments.map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                              <ClipboardList size={14} className="text-amber-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{a.title}</p>
                              <p className="text-xs text-gray-400">{new Date(a.submittedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={a.status} />
                            {a.marks !== null && a.total !== null && (
                              <span className="text-sm font-bold text-gray-700">{a.marks}/{a.total}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quizzes */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <HelpCircle size={18} className="text-purple-500" /> Recent Quizzes
                  </h2>
                  {data.recentQuizzes.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No quizzes attempted yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.recentQuizzes.map((q, i) => {
                        const pct = q.total ? Math.round(((q.score ?? 0) / q.total) * 100) : 0;
                        return (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                <HelpCircle size={14} className="text-purple-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{q.title}</p>
                                <p className="text-xs text-gray-400">{new Date(q.completedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pct >= 75 ? "bg-emerald-100 text-emerald-700" : pct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                                {pct}%
                              </span>
                              <span className="text-sm font-bold text-gray-700">{q.score ?? 0}/{q.total ?? 0}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Trophy banner if all courses done */}
              {data.completedCourses > 0 && data.completedCourses === data.totalCourses && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 flex items-center gap-5 text-white">
                  <Trophy size={40} className="shrink-0" />
                  <div>
                    <p className="text-lg font-bold">All Courses Completed! 🎉</p>
                    <p className="text-indigo-200 text-sm mt-0.5">You've finished every enrolled course. Check your Certificates page to download your achievements.</p>
                  </div>
                  <button
                    onClick={() => router.push("/student/certificates")}
                    className="ml-auto shrink-0 bg-white text-indigo-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    View Certificates
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
