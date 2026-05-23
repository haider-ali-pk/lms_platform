"use client"

import { useEffect, useState, useCallback } from "react"
import {
  BookOpen, Users, DollarSign, TrendingUp,
  RefreshCw, Search, CheckCircle, Clock, ArrowLeft
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts"

// ─── Types ───────────────────────────────────────────────
interface KPI {
  totalCourses: number
  totalEnrollments: number
  activeSubscriptions: number
  monthlyRevenue: number
  enrollmentRevenue: number
  combinedRevenue: number
}

interface SchoolRevenue {
  school_id: string
  name: string
  plan: string
  status: string
  revenue: number
  courses: number
}

interface TopCourse {
  id: string
  title: string
  subject: string | null
  school: string
  enrollments: number
  is_published: boolean
}

interface Course {
  id: string
  title: string
  subject: string | null
  grade_level: string | null
  is_published: boolean
  created_at: string
  school_id: string
  school: string
  enrollments: number
  lessons: number
}

interface School {
  id: string
  name: string
}

const PLAN_COLORS: Record<string, string> = {
  starter:    "bg-blue-100 text-blue-700",
  growth:     "bg-purple-100 text-purple-700",
  enterprise: "bg-yellow-100 text-yellow-700",
  none:       "bg-gray-100 text-gray-500",
}

// ─── Component ───────────────────────────────────────────
export default function CoursesRevenuePage() {
  const [kpi, setKpi]                       = useState<KPI | null>(null)
  const [revenuePerSchool, setRevenuePerSchool] = useState<SchoolRevenue[]>([])
  const [topCourses, setTopCourses]         = useState<TopCourse[]>([])
  const [courses, setCourses]               = useState<Course[]>([])
  const [schools, setSchools]               = useState<School[]>([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState("")
  const [schoolFilter, setSchoolFilter]     = useState("")

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : ""

  const fetchData = useCallback(async (sid = "") => {
    try {
      const url = sid
        ? `/api/super-admin/courses-revenue?school_id=${sid}`
        : "/api/super-admin/courses-revenue"
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setKpi(data.kpi)
      setRevenuePerSchool(data.revenuePerSchool || [])
      setTopCourses(data.topCourses || [])
      setCourses(data.courses || [])
      setSchools(data.schools || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSchoolFilter = (sid: string) => {
    setSchoolFilter(sid)
    fetchData(sid)
  }

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.school.toLowerCase().includes(search.toLowerCase()) ||
    (c.subject || "").toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    )
  }

  // Short school names for chart
  const chartRevenue = revenuePerSchool.map((s) => ({
    ...s,
    shortName: s.name.split(" ").slice(0, 2).join(" ")
  }))

  const chartEnrollments = topCourses.map((c) => ({
    ...c,
    shortTitle: c.title.length > 22 ? c.title.slice(0, 22) + "…" : c.title
  }))

  return (
   <div className="w-full max-w-none p-6 space-y-6">

      {/* Back button */}
      <button onClick={() => window.history.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          Courses & Revenue
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform-wide courses overview and revenue breakdown
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
        {[
          {
            label: "Total Courses",
            value: kpi?.totalCourses || 0,
            icon: <BookOpen className="w-5 h-5" />,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Total Enrollments",
            value: kpi?.totalEnrollments || 0,
            icon: <Users className="w-5 h-5" />,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Monthly Subscription",
            value: `$${(kpi?.monthlyRevenue || 0).toLocaleString()}`,
            icon: <DollarSign className="w-5 h-5" />,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Combined Revenue",
            value: `$${(kpi?.combinedRevenue || 0).toLocaleString()}`,
            icon: <TrendingUp className="w-5 h-5" />,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${k.bg} ${k.color} flex items-center justify-center flex-shrink-0`}>
              {k.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue breakdown row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Stripe Subscriptions</p>
          <p className="text-2xl font-bold text-green-600">${(kpi?.monthlyRevenue || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{kpi?.activeSubscriptions} active plans</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Enrollment Revenue (est.)</p>
          <p className="text-2xl font-bold text-blue-600">${(kpi?.enrollmentRevenue || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{kpi?.totalEnrollments} enrollments × $10</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">

        {/* Revenue per School */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Revenue per School</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="shortName" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Enrolled Courses */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Top 10 Most Enrolled Courses</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={chartEnrollments} 
              layout="vertical" 
              margin={{ top: 10, right: 20, left: 15, bottom: 10 }}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis 
                type="category" 
                dataKey="shortTitle" 
                tick={{ fontSize: 10 }} 
                width={140} 
              />
              <Tooltip formatter={(v: any) => [String(v), "Enrollments"]} />
              <Bar 
                dataKey="enrollments" 
                fill="#3B82F6" 
                radius={[0, 4, 4, 0]} 
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}
