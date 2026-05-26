"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ParentSidebar from "@/components/parent/ParentSidebar";
import { ArrowLeft, FileText, TrendingUp, Award, BookOpen, CalendarCheck, Download } from "lucide-react";

interface Report {
  child_id: string;
  child_name: string;
  school_name: string;
  attendance_pct: number | null;
  avg_quiz_score: number | null;
  courses_completed: number;
  total_courses: number;
  assignments_submitted: number;
  assignments_graded: number;
  certificates: number;
  top_subject: string | null;
}

export default function ParentReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      .then(r => r.json())
      .then(d => setReports(d.reports ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ParentSidebar active="reports" />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500">Full academic summary for each child</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {loading ? (
            [...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />)
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <FileText size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No reports available</p>
            </div>
          ) : reports.map(r => (
            <div key={r.child_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                      {r.child_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{r.child_name}</h3>
                      <p className="text-sm text-gray-400">{r.school_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                  >
                    <Download size={14} /> Print Report
                  </button>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Attendance Rate", value: r.attendance_pct !== null ? `${r.attendance_pct}%` : "—", icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Avg Quiz Score", value: r.avg_quiz_score !== null ? `${r.avg_quiz_score}%` : "—", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Courses Completed", value: `${r.courses_completed}/${r.total_courses}`, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Assignments Done", value: `${r.assignments_submitted}`, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Certificates", value: r.certificates, icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Top Subject", value: r.top_subject ?? "—", icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50" },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
                      <s.icon size={18} className={`${s.color} mb-2`} />
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Performance bar */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Overall Course Progress</span>
                    <span className="font-bold text-gray-900">
                      {r.total_courses > 0 ? Math.round(r.courses_completed / r.total_courses * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${r.total_courses > 0 ? Math.round(r.courses_completed / r.total_courses * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}