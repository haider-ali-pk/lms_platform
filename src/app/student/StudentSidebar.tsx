"use client";
import { useRouter } from "next/navigation";
import { BookOpen, ClipboardList, HelpCircle, TrendingUp, Award, Bot, LayoutDashboard, LogOut } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { label: "My Courses", href: "/student/courses", icon: BookOpen, key: "courses" },
  { label: "Assignments", href: "/student/assignments", icon: ClipboardList, key: "assignments" },
  { label: "Quizzes", href: "/student/quizzes", icon: HelpCircle, key: "quizzes" },
  { label: "Progress", href: "/student/progress", icon: TrendingUp, key: "progress" },
  { label: "Certificates", href: "/student/certificates", icon: Award, key: "certificates" },
  { label: "AI Tutor", href: "/student/ai", icon: Bot, key: "ai" },
];

export default function StudentSidebar({ active }: { active: string }) {
  const router = useRouter();

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
        <NavItem item={NAV[0]} active={active} router={router} />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-2">Learning</p>
        {NAV.slice(1).map(item => <NavItem key={item.key} item={item} active={active} router={router} />)}
      </nav>

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

function NavItem({ item, active, router }: any) {
  const isActive = active === item.key;
  return (
    <button
      onClick={() => router.push(item.href)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? "bg-indigo-50 text-indigo-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
    >
      <item.icon size={18} className={isActive ? "text-indigo-600" : "text-gray-400"} />
      {item.label}
    </button>
  );
}