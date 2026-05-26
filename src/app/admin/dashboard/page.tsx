'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Stats {
  teachers: number
  students: number
  parents: number
  courses: number
  classes: number
}

const enrollmentData = [
  { month: 'Dec', students: 820 },
  { month: 'Jan', students: 940 },
  { month: 'Feb', students: 1020 },
  { month: 'Mar', students: 1150 },
  { month: 'Apr', students: 1280 },
  { month: 'May', students: 1380 },
]

const attendanceData = [
  { day: 'Mon', present: 91, absent: 6, late: 3 },
  { day: 'Tue', present: 88, absent: 8, late: 4 },
  { day: 'Wed', present: 94, absent: 4, late: 2 },
  { day: 'Thu', present: 87, absent: 9, late: 4 },
  { day: 'Fri', present: 90, absent: 7, late: 3 },
]

const recentTeachers = [
  { name: 'Ali Khan', subject: 'Mathematics', classes: 3, students: 120, status: 'Active' },
  { name: 'Sara Ahmed', subject: 'Physics', classes: 2, students: 85, status: 'Active' },
  { name: 'Usman Malik', subject: 'Chemistry', classes: 4, students: 160, status: 'Active' },
  { name: 'Noor Fatima', subject: 'English', classes: 2, students: 90, status: 'On Leave' },
]

const recentStudents = [
  { name: 'Ahmed Raza', grade: 'Grade 9', courses: 4, attendance: '94%', status: 'Active' },
  { name: 'Zara Hassan', grade: 'Grade 10', courses: 5, attendance: '88%', status: 'Active' },
  { name: 'Bilal Sheikh', grade: 'Grade 9', courses: 3, attendance: '76%', status: 'At Risk' },
  { name: 'Amna Butt', grade: 'Grade 11', courses: 6, attendance: '97%', status: 'Active' },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({ teachers: 0, students: 0, parents: 0, courses: 0, classes: 0 })
  const [userName, setUserName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserName(user.name || 'Admin')
    setSchoolName(user.schoolName || 'Your School')

    async function fetchStats() {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/admin/stats', {
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
      label: 'Total Teachers',
      value: loading ? '—' : stats.teachers.toLocaleString(),
      change: '+3 this month',
      changeColor: '#4F46E5', changeBg: '#EEF2FF',
      iconBg: '#EEF2FF', bar: 65, barColor: '#4F46E5',
      icon: <svg className="w-5 h-5" fill="none" stroke="#4F46E5" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    },
    {
      label: 'Total Students',
      value: loading ? '—' : stats.students.toLocaleString(),
      change: '+45 this month',
      changeColor: '#059669', changeBg: '#ECFDF5',
      iconBg: '#ECFDF5', bar: 80, barColor: '#059669',
      icon: <svg className="w-5 h-5" fill="none" stroke="#059669" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>,
    },
    {
      label: 'Active Courses',
      value: loading ? '—' : stats.courses.toLocaleString(),
      change: '+2 this week',
      changeColor: '#0891B2', changeBg: '#ECFEFF',
      iconBg: '#ECFEFF', bar: 55, barColor: '#0891B2',
      icon: <svg className="w-5 h-5" fill="none" stroke="#0891B2" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    },
    {
      label: 'Total Classes',
      value: loading ? '—' : stats.classes.toLocaleString(),
      change: 'This semester',
      changeColor: '#D97706', changeBg: '#FFFBEB',
      iconBg: '#FFFBEB', bar: 45, barColor: '#D97706',
      icon: <svg className="w-5 h-5" fill="none" stroke="#D97706" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    },
  ]

  return (
    <DashboardLayout requiredRole="admin">
      <div className="min-h-screen" style={{ background: '#F8FAFC' }}>

        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 h-14 border-b" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
          <div>
            <p className="text-sm font-medium text-[#1E293B]">Admin Dashboard</p>
            <p className="text-xs text-[#94A3B8]">{schoolName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/students')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#F8FAFC]"
              style={{ borderColor: '#E2E8F0', color: '#64748B' }}
            >
              + Add Student
            </button>
            <button
              onClick={() => router.push('/admin/teachers')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-colors"
              style={{ background: '#4F46E5' }}
            >
              + Add Teacher
            </button>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">

          {/* Greeting */}
          <div className="mb-7">
            <p className="text-sm text-[#64748B] mb-0.5">Good morning,</p>
            <h1 className="text-2xl font-semibold text-[#1E293B]">{userName} 👋</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Here's your school overview for today.</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border p-5 hover:shadow-sm transition-shadow" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-xl" style={{ background: kpi.iconBg }}>{kpi.icon}</div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: kpi.changeBg, color: kpi.changeColor }}>{kpi.change}</span>
                </div>
                <p className="text-2xl font-semibold text-[#1E293B] mb-0.5">{kpi.value}</p>
                <p className="text-sm text-[#64748B] mb-3">{kpi.label}</p>
                <div className="h-1 rounded-full" style={{ background: '#F1F5F9' }}>
                  <div className="h-full rounded-full" style={{ width: `${kpi.bar}%`, background: kpi.barColor }} />
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">

            {/* Enrollment Chart */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <p className="text-sm font-medium text-[#1E293B]">Student Enrollment</p>
              <p className="text-xs text-[#94A3B8] mb-4">Last 6 months growth</p>
              <div style={{ height: 200, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enrollmentData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12 }} formatter={(v: any) => [v, 'Students']} />
                    <Area type="monotone" dataKey="students" stroke="#4F46E5" strokeWidth={2} fill="url(#enrollGrad)" dot={{ r: 3, fill: '#4F46E5', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Chart */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <p className="text-sm font-medium text-[#1E293B]">Weekly Attendance</p>
              <p className="text-xs text-[#94A3B8] mb-4">Present / Absent / Late this week</p>
              <div style={{ height: 200, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12 }} formatter={(v: any) => [`${v}%`, '']} />
                    <Bar dataKey="present" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="late" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

            {/* Recent Teachers */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">Recent Teachers</p>
                  <p className="text-xs text-[#94A3B8]">Active this week</p>
                </div>
                <button onClick={() => router.push('/admin/teachers')} className="text-xs font-medium" style={{ color: '#4F46E5' }}>View all →</button>
              </div>
              <div className="space-y-2">
                {recentTeachers.map((t) => (
                  <div key={t.name} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F8FAFC' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-xs font-semibold">
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#1E293B]">{t.name}</p>
                        <p className="text-xs text-[#94A3B8]">{t.subject} · {t.classes} classes</p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: t.status === 'Active' ? '#ECFDF5' : '#FFFBEB',
                        color: t.status === 'Active' ? '#059669' : '#D97706',
                      }}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Students */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">Recent Students</p>
                  <p className="text-xs text-[#94A3B8]">Enrolled this month</p>
                </div>
                <button onClick={() => router.push('/admin/students')} className="text-xs font-medium" style={{ color: '#4F46E5' }}>View all →</button>
              </div>
              <div className="space-y-2">
                {recentStudents.map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F8FAFC' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#059669] flex items-center justify-center text-white text-xs font-semibold">
                        {s.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#1E293B]">{s.name}</p>
                        <p className="text-xs text-[#94A3B8]">{s.grade} · {s.attendance} attendance</p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: s.status === 'Active' ? '#ECFDF5' : '#FEF2F2',
                        color: s.status === 'Active' ? '#059669' : '#EF4444',
                      }}
                    >
                      {s.status}
                    </span>
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