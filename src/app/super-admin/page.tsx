'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Stats {
  totalSchools: number
  totalUsers: number
  totalStudents: number
  totalTeachers: number
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalSchools: 0, totalUsers: 0, totalStudents: 0, totalTeachers: 0 })
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserName(user.name || '')
    async function fetchStats() {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/super-admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setStats(data.data)
    }
    fetchStats()
  }, [])

  const cards = [
    { label: 'Total Schools', value: stats.totalSchools, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', accent: '#4F46E5', bg: '#EEF2FF', change: '+2 this month' },
    { label: 'Total Users', value: stats.totalUsers, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', accent: '#059669', bg: '#ECFDF5', change: '+12 this week' },
    { label: 'Students', value: stats.totalStudents, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', accent: '#0891B2', bg: '#ECFEFF', change: '+45 this month' },
    { label: 'Teachers', value: stats.totalTeachers, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', accent: '#D97706', bg: '#FFFBEB', change: '+3 this month' },
  ]

  return (
    <DashboardLayout requiredRole="SUPER_ADMIN">
      <div className="p-8 max-w-7xl mx-auto">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-[#64748B] mb-1">Good morning,</p>
            <h1 className="text-2xl font-bold text-[#1E293B]">{userName} 👋</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Here's what's happening on your platform today.</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#94A3B8]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-[#ECFDF5] text-[#059669] text-xs font-medium rounded-full">
              <span className="w-1.5 h-1.5 bg-[#059669] rounded-full animate-pulse"></span>
              Platform Online
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl" style={{ background: card.bg }}>
                  <svg className="w-5 h-5" fill="none" stroke={card.accent} strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                  </svg>
                </div>
                <span className="text-xs text-[#059669] bg-[#ECFDF5] px-2 py-1 rounded-full font-medium">{card.change}</span>
              </div>
              <p className="text-3xl font-bold text-[#1E293B] mb-1">{card.value.toLocaleString()}</p>
              <p className="text-sm text-[#64748B]">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-[#1E293B]">Recent Schools</h2>
              <button
                onClick={() => window.location.href = '/super-admin/schools'}
                className="text-sm text-[#4F46E5] hover:underline font-medium"
              >
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Demo School', plan: 'PROFESSIONAL', students: 1, status: 'Active' },
              ].map((school, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#4F46E5] rounded-xl flex items-center justify-center text-white text-sm font-bold">
                      {school.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">{school.name}</p>
                      <p className="text-xs text-[#64748B]">{school.students} students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 bg-[#EEF2FF] text-[#4F46E5] rounded-full font-medium">{school.plan}</span>
                    <span className="text-xs px-2.5 py-1 bg-[#ECFDF5] text-[#059669] rounded-full font-medium">{school.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-6">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { label: 'Add new school', desc: 'Onboard a new client', icon: 'M12 4v16m8-8H4', accent: '#4F46E5', bg: '#EEF2FF', path: '/super-admin/schools/new' },
                { label: 'Manage users', desc: 'View all platform users', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', accent: '#059669', bg: '#ECFDF5', path: '/super-admin/users' },
                { label: 'View billing', desc: 'Subscriptions & revenue', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', accent: '#D97706', bg: '#FFFBEB', path: '/super-admin/billing' },
                { label: 'Audit log', desc: 'Track all activity', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', accent: '#0891B2', bg: '#ECFEFF', path: '/super-admin/audit' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => window.location.href = action.path}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg flex-shrink-0" style={{ background: action.bg }}>
                    <svg className="w-4 h-4" fill="none" stroke={action.accent} strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1E293B] group-hover:text-[#4F46E5] transition-colors">{action.label}</p>
                    <p className="text-xs text-[#94A3B8]">{action.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#4F46E5] transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}