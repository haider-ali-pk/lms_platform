// src/app/dashboard/parent/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, ClipboardList, TrendingUp, AlertCircle } from "lucide-react";

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
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setError("Not authenticated"); setLoading(false); return; }

    fetch("/api/parent/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setKpis(data.kpis);
        setChildren(data.children);
      })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 text-red-500 p-6">
      <AlertCircle size={18} /> <span>{error}</span>
    </div>
  );

  const kpiCards = [
    {
      label: "Children Enrolled",
      value: kpis?.total_children ?? 0,
      suffix: "",
      icon: <Users size={22} />,
      color: "bg-indigo-500",
    },
    {
      label: "Avg Attendance",
      value: kpis?.avg_attendance ?? 0,
      suffix: "%",
      icon: <TrendingUp size={22} />,
      color: (kpis?.avg_attendance ?? 0) >= 75 ? "bg-green-500" : "bg-red-500",
    },
    {
      label: "Avg Grade",
      value: kpis?.avg_grade ?? 0,
      suffix: "%",
      icon: <TrendingUp size={22} />,
      color: (kpis?.avg_grade ?? 0) >= 60 ? "bg-green-500" : "bg-yellow-500",
    },
    {
      label: "Courses In Progress",
      value: kpis?.courses_in_progress ?? 0,
      suffix: "",
      icon: <BookOpen size={22} />,
      color: "bg-indigo-400",
    },
    {
      label: "Pending Assignments",
      value: kpis?.pending_assignments ?? 0,
      suffix: "",
      icon: <ClipboardList size={22} />,
      color: (kpis?.pending_assignments ?? 0) > 0 ? "bg-red-500" : "bg-green-500",
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Parent Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Monitor your children's academic progress</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-[#1e2a3a] rounded-xl p-4 flex flex-col gap-3 border border-white/5">
            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center text-white`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {card.value}{card.suffix}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Children Table */}
      <div className="bg-[#1e2a3a] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold">Children Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wide border-b border-white/5">
                <th className="text-left px-6 py-3">Child</th>
                <th className="text-left px-6 py-3">School</th>
                <th className="text-left px-6 py-3">Attendance</th>
                <th className="text-left px-6 py-3">Avg Grade</th>
                <th className="text-left px-6 py-3">Courses</th>
                <th className="text-left px-6 py-3">Pending</th>
              </tr>
            </thead>
            <tbody>
              {children.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No children linked to this account.
                  </td>
                </tr>
              ) : (
                children.map((child) => (
                  <tr key={child.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {child.name.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{child.name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{child.school_name}</td>
                    <td className="px-6 py-4">
                      <AttendanceBadge value={child.attendance_pct} />
                    </td>
                    <td className="px-6 py-4">
                      <GradeBadge value={child.avg_grade} />
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {child.courses_in_progress} / {child.total_courses}
                    </td>
                    <td className="px-6 py-4">
                      {child.pending_assignments > 0 ? (
                        <span className="text-red-400 font-semibold">{child.pending_assignments}</span>
                      ) : (
                        <span className="text-green-400">All done</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AttendanceBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-500">No data</span>;
  const color = value >= 75 ? "text-green-400" : value >= 50 ? "text-yellow-400" : "text-red-400";
  return <span className={`font-semibold ${color}`}>{value}%</span>;
}

function GradeBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-500">No data</span>;
  const color = value >= 60 ? "text-green-400" : value >= 40 ? "text-yellow-400" : "text-red-400";
  return <span className={`font-semibold ${color}`}>{value}%</span>;
}