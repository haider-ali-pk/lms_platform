'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Stats {
  totalSchools: number
  totalUsers: number
  totalStudents: number
  totalTeachers: number
}

const revenueData = [
  { month: 'Dec', revenue: 3200, target: 4000 },
  { month: 'Jan', revenue: 4100, target: 4500 },
  { month: 'Feb', revenue: 5300, target: 5000 },
  { month: 'Mar', revenue: 6200, target: 6500 },
  { month: 'Apr', revenue: 7100, target: 7500 },
  { month: 'May', revenue: 8400, target: 9000 },
]

const enrollmentData = [
  { month: 'Dec', students: 1200 },
  { month: 'Jan', students: 1450 },
  { month: 'Feb', students: 1680 },
  { month: 'Mar', students: 1820 },
  { month: 'Apr', students: 2010 },
  { month: 'May', students: 2109 },
]

const planData = [
  { name: 'Starter', value: 4, color: '#4F46E5' },
  { name: 'Professional', value: 5, color: '#06B6D4' },
  { name: 'Enterprise', value: 3, color: '#10B981' },
]

const recentSchools = [
  { name: 'Demo School', city: 'Lahore', plan: 'Professional', students: 312, status: 'Active', statusColor: '#059669', statusBg: '#ECFDF5', planColor: '#4F46E5', planBg: '#EEF2FF', av: '#4F46E5' },
  { name: 'Beacon Academy', city: 'Karachi', plan: 'Enterprise', students: 890, status: 'Active', statusColor: '#059669', statusBg: '#ECFDF5', planColor: '#059669', planBg: '#ECFDF5', av: '#059669' },
  { name: 'Nova Institute', city: 'Islamabad', plan: 'Starter', students: 145, status: 'Trial', statusColor: '#D97706', statusBg: '#FFFBEB', planColor: '#D97706', planBg: '#FFFBEB', av: '#D97706' },
]

const activityLog = [
  { icon: '🏫', text: 'Nova Institute onboarded on Starter plan', time: '2 hours ago', bg: '#EEF2FF' },
  { icon: '👥', text: '34 new students enrolled at Beacon Academy', time: '5 hours ago', bg: '#ECFDF5' },
  { icon: '💳', text: 'Demo School upgraded to Professional plan', time: 'Yesterday, 4:30 PM', bg: '#FFFBEB' },
  { icon: '⚠️', text: 'Payment failed for Al-Noor School — retry pending', time: 'Yesterday, 11:00 AM', bg: '#FEF2F2' },
]

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({ totalSchools: 0, totalUsers: 0, totalStudents: 0, totalTeachers: 0 })
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserName(user.name || 'Super Admin')
    async function fetchStats() {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/super-admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) setStats(data.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const kpis = [
    {
      label: 'Total Schools',
      value: loading ? '—' : stats.totalSchools.toLocaleString(),
      change: '+2 this month',
      changeColor: '#4F46E5',
      changeBg: '#EEF2FF',
      iconBg: '#EEF2FF',
      iconColor: '#4F46E5',
      bar: 60,
      barColor: '#4F46E5',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="#4F46E5" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Total Users',
      value: loading ? '—' : stats.totalUsers.toLocaleString(),
      change: '+147 this week',
      changeColor: '#059669',
      changeBg: '#ECFDF5',
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      bar: 78,
      barColor: '#059669',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="#059669" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Students',
      value: loading ? '—' : stats.totalStudents.toLocaleString(),
      change: '+45 this month',
      changeColor: '#0891B2',
      changeBg: '#ECFEFF',
      iconBg: '#ECFEFF',
      iconColor: '#0891B2',
      bar: 85,
      barColor: '#0891B2',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="#0891B2" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      label: 'Monthly Revenue',
      value: '$8,400',
      change: '+$1.2k MoM',
      changeColor: '#D97706',
      changeBg: '#FFFBEB',
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      bar: 52,
      barColor: '#D97706',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="#D97706" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <DashboardLayout requiredRole="SUPER_ADMIN">
      <div className="min-h-screen" style={{ background: '#F8FAFC' }}>

        {/* Top bar */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-8 h-14 border-b"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          <div>
            <p className="text-sm font-medium text-[#1E293B]">Super Admin Dashboard</p>
            <p className="text-xs text-[#94A3B8]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: '#ECFDF5', color: '#059669' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse inline-block" />
              Platform Online
            </span>
            <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-sm font-medium">
              S
            </div>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">

          {/* Greeting */}
          <div className="mb-7">
            <p className="text-sm text-[#64748B] mb-0.5">Good morning,</p>
            <h1 className="text-2xl font-semibold text-[#1E293B]">{userName} 👋</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Here's your platform overview for today.</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-2xl border p-5 hover:shadow-sm transition-shadow"
                style={{ background: '#fff', borderColor: '#E2E8F0' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-xl" style={{ background: kpi.iconBg }}>
                    {kpi.icon}
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: kpi.changeBg, color: kpi.changeColor }}
                  >
                    {kpi.change}
                  </span>
                </div>
                <p className="text-2xl font-semibold text-[#1E293B] mb-0.5">{kpi.value}</p>
                <p className="text-sm text-[#64748B] mb-3">{kpi.label}</p>
                <div className="h-1 rounded-full" style={{ background: '#F1F5F9' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${kpi.bar}%`, background: kpi.barColor }} />
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">

            {/* Revenue Chart */}
            <div className="xl:col-span-2 rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">Monthly Revenue</p>
                  <p className="text-xs text-[#94A3B8]">Last 6 months · All schools</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#4F46E5' }} />
                    Revenue
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block border border-dashed border-[#06B6D4]" style={{ background: 'transparent' }} />
                    Target
                  </span>
                </div>
              </div>
              <div className="mt-4" style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                      formatter={(value: number | string) => [`$${Number(value).toLocaleString()}`, '']}
                    />
                    <Area type="monotone" dataKey="target" stroke="#06B6D4" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#targetGrad)" dot={false} />
                    <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} fill="url(#revGrad)" dot={{ r: 3, fill: '#4F46E5', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Plan Distribution */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <p className="text-sm font-medium text-[#1E293B] mb-0.5">Plan distribution</p>
              <p className="text-xs text-[#94A3B8] mb-4">Active subscriptions</p>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {planData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12 }}
                      formatter={(v: any) => [Number(v).toLocaleString(), 'Students']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {planData.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[#64748B]">
                      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: p.color }} />
                      {p.name}
                    </span>
                    <span className="font-medium text-[#1E293B]">{p.value} schools</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enrollment Chart + Schools + Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

            {/* Enrollment Bar Chart */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <p className="text-sm font-medium text-[#1E293B] mb-0.5">Student enrollment</p>
              <p className="text-xs text-[#94A3B8] mb-4">Monthly growth</p>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrollmentData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12 }}
                      formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']}
                    />
                    <Bar dataKey="students" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Schools */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">Recent schools</p>
                  <p className="text-xs text-[#94A3B8]">Onboarded this month</p>
                </div>
                <button
                  onClick={() => router.push('/super-admin/schools')}
                  className="text-xs font-medium"
                  style={{ color: '#4F46E5' }}
                >
                  View all →
                </button>
              </div>
              <div className="space-y-3">
                {recentSchools.map((school) => (
                  <div
                    key={school.name}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: '#F8FAFC' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
                        style={{ background: school.av }}
                      >
                        {school.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#1E293B]">{school.name}</p>
                        <p className="text-xs text-[#94A3B8]">{school.students} students · {school.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: school.planBg, color: school.planColor }}
                      >
                        {school.plan}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: school.statusBg, color: school.statusColor }}
                      >
                        {school.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <div className="mb-4">
                <p className="text-sm font-medium text-[#1E293B]">Recent activity</p>
                <p className="text-xs text-[#94A3B8]">Audit log · last 24h</p>
              </div>
              <div className="space-y-4">
                {activityLog.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                      style={{ background: item.bg }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs text-[#1E293B] leading-snug">{item.text}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}