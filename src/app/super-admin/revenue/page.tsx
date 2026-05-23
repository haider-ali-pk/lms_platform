"use client"

import { useEffect, useState, useCallback } from "react"
import { DollarSign, TrendingUp, CreditCard, Users, RefreshCw, ArrowLeft } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

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
}

interface PlanBreakdown {
  [plan: string]: number
}

const PLAN_COLORS: Record<string, string> = {
  starter:    "#6366F1",
  growth:     "#8B5CF6",
  enterprise: "#F59E0B",
  none:       "#D1D5DB",
}

const PIE_COLORS = ["#4F46E5", "#7C3AED", "#F59E0B", "#D1D5DB"]

export default function RevenuePage() {
  const [kpi, setKpi]                       = useState<KPI | null>(null)
  const [revenuePerSchool, setRevenuePerSchool] = useState<SchoolRevenue[]>([])
  const [planBreakdown, setPlanBreakdown]   = useState<PlanBreakdown>({})
  const [loading, setLoading]               = useState(true)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : ""

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/revenue", {
        headers: { Authorization: `Bearer ${token}` },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    )
  }

  const chartRevenue = revenuePerSchool.map((s) => ({
    ...s,
    shortName: s.name.split(" ").slice(0, 2).join(" "),
  }))

  const pieData = Object.entries(planBreakdown).map(([plan, count]) => ({
    name: plan.charAt(0).toUpperCase() + plan.slice(1),
    value: count,
    plan,
  }))

  return (
    <div className="w-full max-w-none p-6 space-y-6">

      {/* Back */}
      <button onClick={() => window.history.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-indigo-600" />
          Revenue
        </h1>
        <p className="text-sm text-gray-500 mt-1">Stripe subscription revenue and enrollment breakdown</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: "Combined Revenue",       value: `$${(kpi?.combinedRevenue || 0).toLocaleString()}`,    icon: <TrendingUp className="w-5 h-5" />,  color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Stripe Subscriptions",   value: `$${(kpi?.monthlyRevenue || 0).toLocaleString()}`,     icon: <CreditCard className="w-5 h-5" />,  color: "text-green-600",  bg: "bg-green-50"  },
          { label: "Enrollment Revenue",     value: `$${(kpi?.enrollmentRevenue || 0).toLocaleString()}`,  icon: <DollarSign className="w-5 h-5" />,  color: "text-blue-600",   bg: "bg-blue-50"   },
          { label: "Active Subscriptions",   value: kpi?.activeSubscriptions || 0,                         icon: <Users className="w-5 h-5" />,       color: "text-purple-600", bg: "bg-purple-50" },
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Revenue per School Bar Chart */}
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

        {/* Plan Breakdown Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Plan Breakdown</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No active subscriptions</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={120} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v: any) => [String(v), "Schools"]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Per School Table */}
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Monthly Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {revenuePerSchool.map((s) => (
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
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {s.status === "none" ? "Inactive" : s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.courses}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">${s.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}