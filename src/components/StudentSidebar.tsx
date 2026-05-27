"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ClipboardList, HelpCircle, TrendingUp, Award, Bot, LayoutDashboard, LogOut, Zap } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { label: "My Courses", href: "/student/courses", icon: BookOpen, key: "courses" },
  { label: "Assignments", href: "/student/assignments", icon: ClipboardList, key: "assignments" },
  { label: "Quizzes", href: "/student/quizzes", icon: HelpCircle, key: "quizzes" },
  { label: "Progress", href: "/student/progress", icon: TrendingUp, key: "progress" },
  { label: "Certificates", href: "/student/certificates", icon: Award, key: "certificates" },
  { label: "AI Tutor", href: "/student/ai", icon: Bot, key: "ai", planBadge: true },
];

const PLAN_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  free:    { label: "Free",  bg: "#F1F5F9", color: "#64748B" },
  basic:   { label: "Basic", bg: "#EEF2FF", color: "#4F46E5" },
  pro:     { label: "Pro",   bg: "#F0FDF4", color: "#16A34A" },
  booster: { label: "Boost", bg: "#FFF7ED", color: "#EA580C" },
};

export default function StudentSidebar({ active }: { active: string }) {
  const router = useRouter();
  const [plan, setPlan] = useState<string>("free");

  useEffect(() => {
    fetch("/api/student/billing")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.plan) setPlan(d.plan) })
      .catch(() => {})
  }, [])

  const planStyle = PLAN_STYLES[plan] ?? PLAN_STYLES.free
  const showUpgrade = !plan || plan === "free"

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">E</div>
          <span className="font-bold text-gray-900">EduFlow</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Overview</p>
        <NavItem item={NAV[0]} active={active} router={router} planStyle={null} />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-2">Learning</p>
        {NAV.slice(1).map(item => (
          <NavItem key={item.key} item={item} active={active} router={router} planStyle={item.planBadge ? planStyle : null} />
        ))}
      </nav>

      {/* Upgrade CTA */}
      {showUpgrade && (
        <div className="px-3 pb-3">
          <button
            onClick={() => router.push("/student/billing")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
          >
            <Zap size={12} />
            Upgrade AI Plan
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/auth/login"); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}

function NavItem({ item, active, router, planStyle }: any) {
  const isActive = active === item.key;
  return (
    <button
      onClick={() => router.push(item.href)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? "bg-indigo-50 text-indigo-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
    >
      <item.icon size={18} className={isActive ? "text-indigo-600" : "text-gray-400"} />
      <span className="flex-1 text-left">{item.label}</span>
      {planStyle && (
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
          style={{ background: planStyle.bg, color: planStyle.color }}
        >
          <Zap size={8} />
          {planStyle.label}
        </span>
      )}
    </button>
  );
}