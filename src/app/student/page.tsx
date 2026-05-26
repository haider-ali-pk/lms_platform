'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { BookOpen, CheckCircle, ClipboardList, TrendingUp, Calendar, MessageSquare } from 'lucide-react'

interface StudentStats {
  enrolledCourses: number
  lessonsCompleted: number
  quizAvgScore: number
  assignmentsPending: number
  attendancePercent: number
  aiTutorChats: number
}

const KPI_CARDS = [
  { key: 'enrolledCourses',    label: 'Enrolled Courses',     icon: BookOpen,      color: 'indigo' },
  { key: 'lessonsCompleted',   label: 'Lessons Completed',    icon: CheckCircle,   color: 'green'  },
  { key: 'quizAvgScore',       label: 'Quiz Avg Score',       icon: TrendingUp,    color: 'amber', suffix: '%' },
  { key: 'assignmentsPending', label: 'Assignments Pending',  icon: ClipboardList, color: 'red'    },
  { key: 'attendancePercent',  label: 'Attendance',           icon: Calendar,      color: 'cyan',  suffix: '%' },
  { key: 'aiTutorChats',       label: 'AI Tutor Chats',       icon: MessageSquare, color: 'purple' },
]

const COLOR_MAP: Record<string, { bg: string; icon: string; text: string }> = {
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', text: 'text-indigo-700' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  text: 'text-green-700'  },
  amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  text: 'text-amber-700'  },
  red:    { bg: 'bg-red-50',    icon: 'text-red-600',    text: 'text-red-700'    },
  cyan:   { bg: 'bg-cyan-50',   icon: 'text-cyan-600',   text: 'text-cyan-700'   },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-700' },
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(user => {
        if (user) setStudentName(`${user.first_name} ${user.last_name}`)
      })

    fetch('/api/student/stats')
      .then(res => res.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">

        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold">Welcome back, {studentName} 👋</h1>
          <p className="text-indigo-200 mt-1">Here is your learning progress at a glance.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {KPI_CARDS.map(({ key, label, icon: Icon, color, suffix }) => {
            const c = COLOR_MAP[color]
            const value = stats ? (stats as any)[key] : 0
            return (
              <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className={`${c.bg} p-3 rounded-lg`}>
                  <Icon className={`${c.icon} w-6 h-6`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className={`text-2xl font-bold ${c.text}`}>{value}{suffix ?? ''}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Learning Progress</h2>
          {[
            { label: 'Attendance', value: stats?.attendancePercent ?? 0, color: 'bg-cyan-500' },
            { label: 'Quiz Average Score', value: stats?.quizAvgScore ?? 0, color: 'bg-amber-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{label}</span>
                <span className="font-medium">{value}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}

          {stats && stats.assignmentsPending > 0 ? (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <ClipboardList className="text-red-500 w-5 h-5" />
              <p className="text-sm text-red-700 font-medium">
                You have {stats.assignmentsPending} pending assignment{stats.assignmentsPending > 1 ? 's' : ''} to submit.
              </p>
            </div>
          ) : (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" />
              <p className="text-sm text-green-700 font-medium">All assignments submitted. Great work!</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'My Courses',  icon: BookOpen,      color: 'indigo', path: '/student/courses' },
              { label: 'Take a Quiz', icon: TrendingUp,    color: 'amber',  path: '/student/quizzes' },
              { label: 'Assignments', icon: ClipboardList, color: 'red',    path: '/student/assignments' },
              { label: 'AI Tutor',    icon: MessageSquare, color: 'purple', path: '/student/ai' },
            ].map(({ label, icon: Icon, color, path }) => {
              const c = COLOR_MAP[color]
              return (
                <a key={label} href={path} className={`${c.bg} rounded-lg p-4 flex flex-col items-center gap-2 hover:opacity-80 transition border border-transparent hover:border-gray-200`}>
                  <Icon className={`${c.icon} w-6 h-6`} />
                  <span className={`text-sm font-medium ${c.text}`}>{label}</span>
                </a>
              )
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}