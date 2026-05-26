"use client"

import { useEffect, useState, useCallback } from "react"
import {
  DollarSign, TrendingUp, CreditCard, Users, RefreshCw,
  ArrowLeft, X, Loader2, Download, Building2
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"

interface KPI {
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
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string | null
  enrollments: number
}

interface PlanBreakdown {
  [plan: string]: number
}

const PIE_COLORS = ["#4F46E5", "#7C3AED", "#F59E0B", "#D1D5DB"]

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function RevenuePage() {
  const [kpi, setKpi]                           = useState<KPI | null>(null)
  const [revenuePerSchool, setRevenuePerSchool] = useState<SchoolRevenue[]>([])
  const [planBreakdown, setPlanBreakdown]       = useState<PlanBreakdown>({})
  const [loading, setLoading]                   = useState(true)
  const [monthFilter, setMonthFilter]           = useState("")
  const [yearFilter, setYearFilter]             = useState("")
  const [selectedSchool, setSelectedSchool]     = useState<SchoolRevenue | null>(null)
  const [detailModal, setDetailModal]           = useState(false)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : ""

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/revenue", {
      })
      const data = await res.json()
      setKpi(data.kpi)
      setRevenuePerSchool(data.revenuePerSchool || [])
      setPlanBreakdown(data.planBreakdown || {})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Filter by month/year ───────────────────────────────────────
  const filtered = revenuePerSchool.filter((s) => {
    if (!monthFilter && !yearFilter) return true
    if (!s.current_period_start) return false
    const d = new Date(s.current_period_start)
    const matchMonth = monthFilter ? d.getMonth() === parseInt(monthFilter) : true
    const matchYear  = yearFilter  ? d.getFullYear() === parseInt(yearFilter) : true
    return matchMonth && matchYear
  })

  // ── CSV Export ─────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["School", "Plan", "Status", "Courses", "Enrollments", "Monthly Revenue", "Period Start", "Period End"]
    const rows = filtered.map((s) => [
      s.name,
      s.plan,
      s.status,
      s.courses,
      s.enrollments,
      `$${s.revenue}`,
      s.current_period_start ? new Date(s.current_period_start).toLocaleDateString() : "—",
      s.current_period_end   ? new Date(s.current_period_end).toLocaleDateString()   : "—",
    ])
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `revenue-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    )
  }

  const chartRevenue = filtered.map((s) => ({
    ...s,
    shortName: s.name.split(" ").slice(0, 2).join(" "),
  }))

  const pieData = Object.entries(planBreakdown).map(([plan, count]) => ({
    name:  plan.charAt(0).toUpperCase() + plan.slice(1),
    value: count,
    plan,
  }))

  const years = Array.from(
    new Set(
      revenuePerSchool
        .filter((s) => s.current_period_start)
        .map((s) => new Date(s.current_period_start!).getFullYear())
    )
  ).sort((a, b) => b - a)

  return (
    <div className="w-full max-w-none p-6 space-y-6">

      {/* Back */}
      <button onClick={() => window.history.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-indigo-600" /> Revenue
          </h1>
          <p className="text-sm text-gray-500 mt-1">Stripe subscription revenue and enrollment breakdown</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: "Combined Revenue",     value: `$${(kpi?.combinedRevenue || 0).toLocaleString()}`,   icon: <TrendingUp className="w-5 h-5" />,  color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Stripe Subscriptions", value: `$${(kpi?.monthlyRevenue || 0).toLocaleString()}`,    icon: <CreditCard className="w-5 h-5" />,  color: "text-green-600",  bg: "bg-green-50"  },
          { label: "Enrollment Revenue",   value: `$${(kpi?.enrollmentRevenue || 0).toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />,  color: "text-blue-600",   bg: "bg-blue-50"   },
          { label: "Active Subscriptions", value: kpi?.activeSubscriptions || 0,                        icon: <Users className="w-5 h-5" />,       color: "text-purple-600", bg: "bg-purple-50" },
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <p className="text-sm font-medium text-gray-600">Filter by:</p>
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {(monthFilter || yearFilter) && (
          <button onClick={() => { setMonthFilter(""); setYearFilter("") }}
            className="text-sm text-red-500 hover:text-red-700 transition">
            Clear filters
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} schools</span>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Plan Breakdown</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No active subscriptions</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={120} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v: any) => [String(v), "Schools"]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* School Subscription Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">School Subscription Details</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">School</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Courses</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Enrollments</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Monthly Revenue</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <tr key={s.school_id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    s.plan === "starter"    ? "bg-blue-100 text-blue-700" :
                    s.plan === "growth"     ? "bg-purple-100 text-purple-700" :
                    s.plan === "enterprise" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {s.plan === "none" ? "No Plan" : s.plan.charAt(0).toUpperCase() + s.plan.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    s.status === "active"   ? "bg-green-100 text-green-700" :
                    s.status === "trialing" ? "bg-blue-100 text-blue-700" :
                    s.status === "past_due" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {s.status === "none" ? "Inactive" : s.status.charAt(0).toUpperCase() + s.status.slice(1).replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.courses}</td>
                <td className="px-4 py-3 text-gray-600">{s.enrollments}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">${s.revenue.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => { setSelectedSchool(s); setDetailModal(true) }}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition">
                    <Building2 className="w-3 h-3" /> Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* School Detail Modal */}
      {detailModal && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{selectedSchool.name}</h2>
              <button onClick={() => { setDetailModal(false); setSelectedSchool(null) }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">

              {/* Plan + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Plan</p>
                  <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    selectedSchool.plan === "starter"    ? "bg-blue-100 text-blue-700" :
                    selectedSchool.plan === "growth"     ? "bg-purple-100 text-purple-700" :
                    selectedSchool.plan === "enterprise" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {selectedSchool.plan === "none" ? "No Plan" : selectedSchool.plan.charAt(0).toUpperCase() + selectedSchool.plan.slice(1)}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    selectedSchool.status === "active"   ? "bg-green-100 text-green-700" :
                    selectedSchool.status === "trialing" ? "bg-blue-100 text-blue-700" :
                    selectedSchool.status === "past_due" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {selectedSchool.status === "none" ? "Inactive" : selectedSchool.status.charAt(0).toUpperCase() + selectedSchool.status.slice(1).replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Monthly Revenue", value: `$${selectedSchool.revenue.toLocaleString()}`, color: "text-green-600" },
                  { label: "Courses",         value: selectedSchool.courses,                         color: "text-indigo-600" },
                  { label: "Enrollments",     value: selectedSchool.enrollments,                     color: "text-blue-600"   },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Subscription Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Period Start</p>
                  <p className="font-semibold text-gray-800 mt-0.5 text-sm">
                    {selectedSchool.current_period_start
                      ? new Date(selectedSchool.current_period_start).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Period End</p>
                  <p className="font-semibold text-gray-800 mt-0.5 text-sm">
                    {selectedSchool.current_period_end
                      ? new Date(selectedSchool.current_period_end).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Subscribed Since</p>
                  <p className="font-semibold text-gray-800 mt-0.5 text-sm">
                    {selectedSchool.created_at
                      ? new Date(selectedSchool.created_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Cancel at Period End</p>
                  <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedSchool.cancel_at_period_end ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}>
                    {selectedSchool.cancel_at_period_end ? "Yes — Cancelling" : "No — Active"}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}