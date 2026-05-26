"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, TrendingUp, CalendarCheck, FileText, LogOut, GraduationCap } from "lucide-react";

const NAV = [
  { href: "/parent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parent/children", label: "My Children", icon: Users },
  { href: "/parent/progress", label: "Progress", icon: TrendingUp },
  { href: "/parent/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/parent/reports", label: "Reports", icon: FileText },
];

export default function ParentSidebar({ active }: { active: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      router.push("/auth/login");
    });
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen shrink-0">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">EduFlow</p>
            <p className="text-xs text-gray-400">Parent Portal</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={18} className={isActive ? "text-indigo-600" : "text-gray-400"} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={18} className="text-gray-400" />
          Logout
        </button>
      </div>
    </aside>
  );
}