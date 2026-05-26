"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ParentSidebar from "@/components/parent/ParentSidebar";
import { ArrowLeft, TrendingUp, BookOpen, CheckCircle, Clock, Star } from "lucide-react";

interface Course {
  id: string;
  title: string;
  subject: string;
  lessons_total: number;
  lessons_completed: number;
  completed_at: string | null;
  quiz_attempts: { score: number; passed: boolean; created_at: string }[];
}

interface ChildProgress {
  id: string;
  name: string;
  school_name: string;
  courses: Course[];
}

function ProgressContent() {
  const router = useRouter();
  const params = useSearchParams();
  const childIdFromUrl = params.get("child");

  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [childrenLoading, setChildrenLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch("/api/parent/children", { ` } })
      .then(r => r.json())
      .then(d => {
        const list = d.children ?? [];
        setChildren(list);
        if (childIdFromUrl && list.find((c: any) => c.id === childIdFromUrl)) {
          setSelected(childIdFromUrl);
        } else if (list.length > 0) {
          setSelected(list[0].id);
        }
      })
      .finally(() => setChildrenLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const token = localStorage.getItem("token");
    setLoading(true);
    setProgress(null);
    fetch(`/api/parent/progress?child_id=${selected}`, { ` } })
      .then(r => r.json())
      .then(d => setProgress(d.progress ?? null))
      .finally(() => setLoading(false));
  }, [selected]);

  const completedCourses = progress?.courses.filter(c => c.completed_at).length ?? 0;
  const totalCourses = progress?.courses.length ?? 0;
  const overallPct = totalCourses > 0
    ? Math.round(progress!.courses.reduce((sum, c) =>
        sum + (c.lessons_total > 0 ? c.lessons_completed / c.lessons_total : 0), 0) / totalCourses * 100)
    : 0;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ParentSidebar active="progress" />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Academic Progress</h1>
            <p className="text-sm text-gray-500">Course completion and quiz performance</p>
          </div>
          {children.length > 1 && (
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="ml-auto px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        <div className="p-8 space-y-6">
          {/* Summary */}
          {progress && !loading && (
            <div className="grid grid-cols-3 gap-5">
              {[
                { label: "Overall Progress", value: `${overallPct}%`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Courses Completed", value: `${completedCourses}/${totalCourses}`, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Total Quizzes Taken", value: progress.courses.reduce((s, c) => s + c.quiz_attempts.length, 0), icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.bg}`}>
                    <s.icon size={20} className={s.color} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading */}
          {(loading || childrenLoading) && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />
              ))}
            </div>
          )}

          {/* No data */}
          {!loading && !childrenLoading && !progress && (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <TrendingUp size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No progress data available</p>
              <p className="text-sm text-gray-400 mt-1">Your child has not started any courses yet.</p>
            </div>
          )}

          {/* Course cards */}
          {!loading && progress?.courses.map(course => {
            const pct = course.lessons_total > 0
              ? Math.round(course.lessons_completed / course.lessons_total * 100)
              : 0;
            const bestQuiz = course.quiz_attempts.length > 0
              ? Math.max(...course.quiz_attempts.map(a => a.score))
              : null;
            return (
              <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <BookOpen size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{course.title}</h3>
                      <p className="text-xs text-gray-400">{course.subject}</p>
                    </div>
                  </div>
                  {course.completed_at ? (
                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                      <CheckCircle size={11} /> Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                      <Clock size={11} /> In Progress
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>{course.lessons_completed}/{course.lessons_total} lessons</span>
                    <span className="font-semibold text-gray-700">{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {bestQuiz !== null && (
                  <div className="flex items-center gap-2 mt-3">
                    <Star size={13} className="text-amber-400" />
                    <span className="text-xs text-gray-500">
                      Best quiz score: <span className="font-bold text-gray-800">{bestQuiz}%</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      ({course.quiz_attempts.length} attempt{course.quiz_attempts.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function ParentProgressPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProgressContent />
    </Suspense>
  );
}
