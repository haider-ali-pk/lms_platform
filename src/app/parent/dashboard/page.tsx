"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ParentSidebar from "@/components/parent/ParentSidebar";
import { Users, TrendingUp, BookOpen, ClipboardList, ArrowRight, Award, AlertCircle, CheckCircle } from "lucide-react";

interface Child {
  id: string;
  name: string;
  avatar_url: string | null;
  school_name: string;
  attendance_pct: number | null;
  avg_grade: number | null;
  courses_in_progress: number;
  total_courses: number;
  pending_assignments: number;
}

interface Kpis {
  total_children: number;
  avg_attendance: number;
  avg_grade: number;
  courses_in_progress: number;
  pending_assignments: number;
}

export default function ParentDashboard() {
  const router = useRouter();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
useEffect(() => {
    fetch("/api/parent/stats")
      .then(r => r.json())
      .then(d => { setKpis(d.kpis); setChildren(d.children ?? []); })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ParentSidebar active="dashboard" />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-5">
          <h1 className="text-xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-sm text-gray-500">Monitor your children's academic progress</p>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 rounded-2xl p-4 flex items-center gap-2 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
            {[
              { label: "Children Enrolled", value: kpis?.total_children ?? 0, suffix: "", icon: Users, color: "bg-indigo-50", iconColor: "text-indigo-600", border: "border-l-indigo-500" },
              { label: "Avg Attendance", value: kpis?.avg_attendance ?? 0, suffix: "%", icon: TrendingUp, color: "bg-emerald-50", iconColor: "text-emerald-600", border: "border-l-emerald-500" },
              { label: "Courses In Progress", value: kpis?.courses_in_progress ?? 0, suffix: "", icon: BookOpen, color: "bg-blue-50", iconColor: "text-blue-600", border: "border-l-blue-500" },
              { label: "Pending Assignments", value: kpis?.pending_assignments ?? 0, suffix: "", icon: ClipboardList, color: "bg-amber-50", iconColor: "text-amber-600", border: "border-l-amber-500" },
            ].map(s => (
              <div key={s.label} className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${s.border} shadow-sm p-5 flex items-center gap-4`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon size={20} className={s.iconColor} />
                </div>
                <div>
                  {loading ? <div className="h-7 w-12 bg-gray-100 rounded animate-pulse mb-1" /> : (
                    <p className="text-2xl font-bold text-gray-900">{s.value}{s.suffix}</p>
                  )}
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Children Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">My Children</h2>
              <button onClick={() => router.push("/parent/children")} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                View all <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />)}
              </div>
            ) : children.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users size={24} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No children linked</p>
                <p className="text-sm text-gray-400">Contact your school admin to link your children.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {children.map(child => (
                  <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                        {child.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{child.name}</p>
                        <p className="text-xs text-gray-400">{child.school_name}</p>
                      </div>
                      <div className="ml-auto">
                        {child.pending_assignments > 0 ? (
                          <span className="bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <AlertCircle size={11} /> {child.pending_assignments} pending
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle size={11} /> All done
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className={`text-lg font-bold ${(child.attendance_pct ?? 0) >= 75 ? "text-emerald-600" : "text-red-500"}`}>
                          {child.attendance_pct !== null ? `${child.attendance_pct}%` : "—"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Attendance</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className={`text-lg font-bold ${(child.avg_grade ?? 0) >= 60 ? "text-emerald-600" : "text-amber-500"}`}>
                          {child.avg_grade !== null ? `${child.avg_grade}%` : "—"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Avg Grade</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-indigo-600">{child.courses_in_progress}/{child.total_courses}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Courses</p>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/parent/progress?child=${child.id}`)}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-indigo-100 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors"
                    >
                      <Award size={14} /> View Progress
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}