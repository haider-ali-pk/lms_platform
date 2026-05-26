"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ParentSidebar from "@/components/parent/ParentSidebar";
import { ArrowLeft, CalendarCheck, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "late" | "excused";
  note: string | null;
  class_name: string;
}

interface ChildAttendance {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  pct: number;
  records: AttendanceRecord[];
}

const STATUS_CONFIG = {
  present: { label: "Present", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  absent: { label: "Absent", color: "bg-red-100 text-red-700", icon: XCircle },
  late: { label: "Late", color: "bg-amber-100 text-amber-700", icon: Clock },
  excused: { label: "Excused", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
};

export default function ParentAttendancePage() {
  const router = useRouter();
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [data, setData] = useState<ChildAttendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch("/api/parent/children", { ` } })
      .then(r => r.json())
      .then(d => {
        setChildren(d.children ?? []);
        if (d.children?.length > 0) setSelected(d.children[0].id);
      })
      .finally(() => setPageLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const token = localStorage.getItem("token");
    setLoading(true);
    fetch(`/api/parent/attendance?child_id=${selected}`, { ` } })
      .then(r => r.json())
      .then(d => setData(d.attendance ?? null))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ParentSidebar active="attendance" />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
            <p className="text-sm text-gray-500">Daily attendance records</p>
          </div>
          {children.length > 0 && (
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
          {/* Summary stats */}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { label: "Present", value: data.present, color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
                { label: "Absent", value: data.absent, color: "text-red-500", bg: "bg-red-50", icon: XCircle },
                { label: "Late", value: data.late, color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
                { label: "Attendance Rate", value: `${data.pct}%`, color: data.pct >= 75 ? "text-emerald-600" : "text-red-500", bg: data.pct >= 75 ? "bg-emerald-50" : "bg-red-50", icon: CalendarCheck },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.bg}`}>
                    <s.icon size={20} className={s.color} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Records table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Attendance Records</h2>
            </div>
            {pageLoading || loading ? (
              <div className="p-8 flex justify-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !data || data.records.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarCheck size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No attendance records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Date", "Class", "Status", "Note"].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.records.map((rec, i) => {
                      const cfg = STATUS_CONFIG[rec.status];
                      const Icon = cfg.icon;
                      return (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                            {new Date(rec.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{rec.class_name}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                              <Icon size={11} /> {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">{rec.note ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
