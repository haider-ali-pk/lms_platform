'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
  label: string
  path: string
  icon: string
}

interface SidebarProps {
  role: string
  userName: string
  schoolName?: string
}

const navItems: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { label: 'Dashboard', path: '/super-admin', icon: '🏠' },
    { label: 'Schools', path: '/super-admin/schools', icon: '🏫' },
    { label: 'Users', path: '/super-admin/users', icon: '👥' },
    { label: 'Billing', path: '/super-admin/billing', icon: '💳' },
    { label: 'Audit Log', path: '/super-admin/audit', icon: '📋' },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/admin', icon: '🏠' },
    { label: 'Teachers', path: '/admin/teachers', icon: '👨‍🏫' },
    { label: 'Students', path: '/admin/students', icon: '👨‍🎓' },
    { label: 'Parents', path: '/admin/parents', icon: '👪' },
    { label: 'Classes', path: '/admin/classes', icon: '📚' },
    { label: 'Courses', path: '/admin/courses', icon: '🎓' },
    { label: 'Reports', path: '/admin/reports', icon: '📊' },
  ],
  TEACHER: [
    { label: 'Dashboard', path: '/teacher', icon: '🏠' },
    { label: 'My Courses', path: '/teacher/courses', icon: '🎓' },
    { label: 'Classes', path: '/teacher/classes', icon: '📚' },
    { label: 'Assignments', path: '/teacher/assignments', icon: '📝' },
    { label: 'Quizzes', path: '/teacher/quizzes', icon: '❓' },
    { label: 'Attendance', path: '/teacher/attendance', icon: '✅' },
    { label: 'AI Tutor', path: '/teacher/ai', icon: '🤖' },
  ],
  STUDENT: [
    { label: 'Dashboard', path: '/student', icon: '🏠' },
    { label: 'My Courses', path: '/student/courses', icon: '🎓' },
    { label: 'Assignments', path: '/student/assignments', icon: '📝' },
    { label: 'Quizzes', path: '/student/quizzes', icon: '❓' },
    { label: 'Progress', path: '/student/progress', icon: '📈' },
    { label: 'Certificates', path: '/student/certificates', icon: '🏆' },
    { label: 'AI Tutor', path: '/student/ai', icon: '🤖' },
  ],
  PARENT: [
    { label: 'Dashboard', path: '/parent', icon: '🏠' },
    { label: 'My Children', path: '/parent/children', icon: '👨‍👧' },
    { label: 'Progress', path: '/parent/progress', icon: '📈' },
    { label: 'Attendance', path: '/parent/attendance', icon: '✅' },
    { label: 'Reports', path: '/parent/reports', icon: '📊' },
  ],
}

export default function Sidebar({ role, userName, schoolName }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const items = navItems[role] || []

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} min-h-screen bg-white border-r border-[#E2E8F0] flex flex-col transition-all duration-300`}>
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">E</span>
            </div>
            <span className="font-bold text-[#1E293B]">EduFlow</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 py-3 border-b border-[#E2E8F0]">
          <p className="text-xs text-[#64748B]">Signed in as</p>
          <p className="text-sm font-medium text-[#1E293B] truncate">{userName}</p>
          {schoolName && <p className="text-xs text-[#4F46E5] truncate">{schoolName}</p>}
        </div>
      )}

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              pathname === item.path
                ? 'bg-[#EEF2FF] text-[#4F46E5] font-medium'
                : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-[#E2E8F0]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <span className="text-lg">🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}