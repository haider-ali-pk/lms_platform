"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ParentSidebar from "@/components/parent/ParentSidebar";
import { ArrowLeft, Users, BookOpen, CalendarCheck, TrendingUp, AlertCircle, ChevronRight } from "lucide-react";

interface Child {
  id: string;
  name: string;
  avatar_url: string | null;
  school_name: string;
  email: string;
  grade: string | null;
  attendance_pct: number | null;
  avg_grade: number | null;
  courses_in_progress: number;
  total_courses: number;
  pending_assignments: number;
}

export default function ParentChildrenPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ParentSidebar active="my-children" />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Children</h1>
            <p className="text-sm text-gray-500">Detailed view of all linked children</p>
          </div>
          <div className="ml-auto bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Users size={16} /> {children.length} {children.length === 1 ? "Child" : "Children"}
          </div>
        </div>

        <div className="p-8 space-y-5">
          {error && <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

          {loading ? (
            [...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-52 animate-pulse" />)
          ) : children.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-700">No children linked</p>
              <p className="text-sm text-gray-400 mt-1">Contact your school admin to link your children.</p>
            </div>
          ) : children.map(child => (
            <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{child.name}</h3>
                      <p className="text-sm text-gray-400">{child.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{child.school_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/parent/progress?child=${child.id}`)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    View Progress <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Attendance", value: child.attendance_pct !== null ? `${child.attendance_pct}%` : "—", icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Avg Grade", value: child.avg_grade !== null ? `${child.avg_grade}%` : "—", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Courses", value: `${child.courses_in_progress}/${child.total_courses}`, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Pending", value: child.pending_assignments > 0 ? `${child.pending_assignments}` : "All done", icon: AlertCircle, color: child.pending_assignments > 0 ? "text-red-500" : "text-emerald-600", bg: child.pending_assignments > 0 ? "bg-red-50" : "bg-emerald-50" },
                  ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
                      <stat.icon size={18} className={`${stat.color} mb-2`} />
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}