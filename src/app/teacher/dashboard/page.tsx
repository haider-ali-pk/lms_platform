'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Stats {
  courses: number
  classes: number
  pendingAssignments: number
  totalStudents: number
}

const quizScoreData = [
  { quiz: 'Math Q1', avg: 72 },
  { quiz: 'Math Q2', avg: 68 },
  { quiz: 'Physics Q1', avg: 81 },
  { quiz: 'Physics Q2', avg: 75 },
  { quiz: 'Chem Q1', avg: 65 },
]

const attendanceData = [
  { day: 'Mon', rate: 92 },
  { day: 'Tue', rate: 88 },
  { day: 'Wed', rate: 95 },
  { day: 'Thu', rate: 85 },
  { day: 'Fri', rate: 90 },
]

const myCourses = [
  { title: 'Mathematics — Grade 9', students: 45, lessons: 12, progress: 75, status: 'Active' },
  { title: 'Physics — Grade 10', students: 38, lessons: 9, progress: 55, status: 'Active' },
  { title: 'Chemistry — Grade 11', students: 42, lessons: 6, progress: 35, status: 'Active' },
]

const pendingSubmissions = [
  { student: 'Ahmed Raza', assignment: 'Math Weekly #4', submitted: '2 hours ago', grade: 'Grade 9' },
  { student: 'Zara Hassan', assignment: 'Physics Lab Report', submitted: '5 hours ago', grade: 'Grade 10' },
  { student: 'Bilal Sheikh', assignment: 'Math Weekly #4', submitted: 'Yesterday', grade: 'Grade 9' },
  { student: 'Amna Butt', assignment: 'Chemistry Assignment', submitted: 'Yesterday', grade: 'Grade 11' },
]

export default function TeacherDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({ courses: 0, classes: 0, pendingAssignments: 0, totalStudents: 0 })
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserName(user.name || 'Teacher')

    async function fetchStats() {
      try {
        const res = await fetch('/api/teacher/stats', {
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
      label: 'My Courses',
      value: loading ? '—' : stats.courses.toLocaleString(),
      change: 'Published',
      changeColor: '#4F46E5', changeBg: '#EEF2FF',
      iconBg: '#EEF2FF', bar: 60, barColor: '#4F46E5',
      icon: <svg className="w-5 h-5" fill="none" stroke="#4F46E5" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    },
    {
      label: 'My Classes',
      value: loading ? '—' : stats.classes.toLocaleString(),
      change: 'This semester',
      changeColor: '#059669', changeBg: '#ECFDF5',
      iconBg: '#ECFDF5', bar: 45, barColor: '#059669',
      icon: <svg className="w-5 h-5" fill="none" stroke="#059669" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    },
    {
      label: 'Total Students',
      value: loading ? '—' : stats.totalStudents.toLocaleString(),
      change: 'Enrolled',
      changeColor: '#0891B2', changeBg: '#ECFEFF',
      iconBg: '#ECFEFF', bar: 80, barColor: '#0891B2',
      icon: <svg className="w-5 h-5" fill="none" stroke="#0891B2" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>,
    },
    {
      label: 'Pending Grading',
      value: loading ? '—' : stats.pendingAssignments.toLocaleString(),
      change: 'Need review',
      changeColor: '#EF4444', changeBg: '#FEF2F2',
      iconBg: '#FEF2F2', bar: 35, barColor: '#EF4444',
      icon: <svg className="w-5 h-5" fill="none" stroke="#EF4444" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    },
  ]

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="min-h-screen" style={{ background: '#F8FAFC' }}>

        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 h-14 border-b" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
          <div>
            <p className="text-sm font-medium text-[#1E293B]">Teacher Dashboard</p>
            <p className="text-xs text-[#94A3B8]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/teacher/courses')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#F8FAFC]"
              style={{ borderColor: '#E2E8F0', color: '#64748B' }}
            >
              + New Lesson
            </button>
            <button
              onClick={() => router.push('/teacher/quizzes')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
              style={{ background: '#4F46E5' }}
            >
              + Create Quiz
            </button>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">

          {/* Greeting */}
          <div className="mb-7">
            <p className="text-sm text-[#64748B] mb-0.5">Good morning,</p>
            <h1 className="text-2xl font-semibold text-[#1E293B]">{userName} 👋</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Here's your teaching overview for today.</p>
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

            {/* Quiz Scores */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <p className="text-sm font-medium text-[#1E293B]">Quiz Performance</p>
              <p className="text-xs text-[#94A3B8] mb-4">Average scores across my quizzes</p>
              <div style={{ height: 200, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quizScoreData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="quiz" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12 }} formatter={(v: any) => [`${v}%`, 'Avg Score']} />
                    <Bar dataKey="avg" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <p className="text-sm font-medium text-[#1E293B]">Attendance Rate</p>
              <p className="text-xs text-[#94A3B8] mb-4">My classes this week</p>
              <div style={{ height: 200, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[70, 100]} />
                    <Tooltip contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12 }} formatter={(v: any) => [`${v}%`, 'Attendance']} />
                    <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2} dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

            {/* My Courses */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">My Courses</p>
                  <p className="text-xs text-[#94A3B8]">Currently teaching</p>
                </div>
                <button onClick={() => router.push('/teacher/courses')} className="text-xs font-medium" style={{ color: '#4F46E5' }}>View all →</button>
              </div>
              <div className="space-y-3">
                {myCourses.map((c) => (
                  <div key={c.title} className="p-3 rounded-xl" style={{ background: '#F8FAFC' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-[#1E293B]">{c.title}</p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#ECFDF5', color: '#059669' }}>{c.status}</span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mb-2">{c.students} students · {c.lessons} lessons</p>
                    <div className="h-1.5 rounded-full" style={{ background: '#E2E8F0' }}>
                      <div className="h-full rounded-full" style={{ width: `${c.progress}%`, background: '#4F46E5' }} />
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1">{c.progress}% complete</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Submissions */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">Pending Grading</p>
                  <p className="text-xs text-[#94A3B8]">Submissions waiting for review</p>
                </div>
                <button onClick={() => router.push('/teacher/assignments')} className="text-xs font-medium" style={{ color: '#4F46E5' }}>View all →</button>
              </div>
              <div className="space-y-2">
                {pendingSubmissions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F8FAFC' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-xs font-semibold">
                        {s.student.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#1E293B]">{s.student}</p>
                        <p className="text-xs text-[#94A3B8]">{s.assignment} · {s.submitted}</p>
                      </div>
                    </div>
                    <button
                      className="text-xs font-medium px-2.5 py-1 rounded-lg text-white"
                      style={{ background: '#4F46E5' }}
                    >
                      Grade
                    </button>
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