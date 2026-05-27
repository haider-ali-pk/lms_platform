"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle, CreditCard, Check, X, Search, Zap,
  Building2, TrendingUp, ExternalLink, RefreshCw,
  CheckCircle, XCircle, Clock, AlertTriangle
} from "lucide-react";
import BackButton from "@/components/BackButton";

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
  stripe_customer_id: string;
}

interface School {
  id: string;
  name: string;
  city: string | null;
  email: string;
  is_active: boolean;
  _count: { users: number };
  stripe_subscription: Subscription | null;
}

interface Stats {
  totalMRR: number;
  schoolMRR: number;
  studentMRR: number;
  activeSchools: number;
  pastDueCount: number;
  noplanCount: number;
  paidStudents: number;
}

const PLANS = ["starter", "growth", "enterprise"];
const STATUSES = ["active", "trialing", "past_due", "canceled", "unpaid"];

const PLAN_STYLES: Record<string, string> = {
  starter: "bg-blue-50 text-blue-600 border border-blue-200",
  growth: "bg-purple-50 text-purple-600 border border-purple-200",
  enterprise: "bg-amber-50 text-amber-600 border border-amber-200",
};

const PLAN_PRICES: Record<string, number> = {
  starter: 49,
  growth: 99,
  enterprise: 199,
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  trialing: "bg-blue-50 text-blue-500 border border-blue-200",
  past_due: "bg-red-50 text-red-500 border border-red-200",
  canceled: "bg-gray-100 text-gray-500 border border-gray-200",
  unpaid: "bg-red-50 text-red-600 border border-red-200",
};

const STATUS_ICONS: Record<string, React.ReactElement> = {
  active: <CheckCircle size={11} />,
  trialing: <Clock size={11} />,
  past_due: <AlertTriangle size={11} />,
  canceled: <XCircle size={11} />,
  unpaid: <XCircle size={11} />,
};

export default function BillingPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [filtered, setFiltered] = useState<School[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMRR: 0, schoolMRR: 0, studentMRR: 0, activeSchools: 0, pastDueCount: 0, noplanCount: 0, paidStudents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Assign modal
  const [modalSchool, setModalSchool] = useState<School | null>(null);
  const [modalMode, setModalMode] = useState<"assign" | "checkout">("assign");
  const [plan, setPlan] = useState("starter");
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Cancel confirm
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchBilling() {
    setLoading(true);
    const res = await fetch("/api/super-admin/billing");
    const data = await res.json();
    if (data.error) { setError(data.error); setLoading(false); return; }
    setSchools(data.schools);
    setStats({
  totalMRR: data.totalMRR,
  schoolMRR: data.schoolMRR,
  studentMRR: data.studentMRR,
  activeSchools: data.activeSchools,
  pastDueCount: data.pastDueCount,
  noplanCount: data.noplanCount,
  paidStudents: data.paidStudents,
});
    setLoading(false);
  }

  useEffect(() => { fetchBilling(); }, []);

  // Check for success/canceled query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      showToast("Stripe checkout completed successfully!");
      window.history.replaceState({}, "", "/super-admin/billing");
    }
    if (params.get("canceled")) {
      showToast("Checkout was canceled.", "error");
      window.history.replaceState({}, "", "/super-admin/billing");
    }
  }, []);

  useEffect(() => {
    let list = schools;
    const q = search.toLowerCase();
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q));
    if (filterPlan !== "all") list = list.filter((s) => s.stripe_subscription?.plan === filterPlan);
    if (filterStatus !== "all") {
      if (filterStatus === "none") list = list.filter((s) => !s.stripe_subscription);
      else list = list.filter((s) => s.stripe_subscription?.status === filterStatus);
    }
    setFiltered(list);
  }, [search, schools, filterPlan, filterStatus]);

  function openModal(school: School) {
    setModalSchool(school);
    setPlan(school.stripe_subscription?.plan ?? "starter");
    setStatus(school.stripe_subscription?.status ?? "active");
    setFormError("");
    setModalMode("assign");
  }

  async function handleAssign() {
    if (!modalSchool) return;
    setSubmitting(true);
    setFormError("");
    const res = await fetch(`/api/super-admin/billing/${modalSchool.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, status }),
    });
    const data = await res.json();
    if (data.error) { setFormError(data.error); setSubmitting(false); return; }
    setModalSchool(null);
    showToast("Plan updated successfully!");
    fetchBilling();
    setSubmitting(false);
  }

  async function handleStripeCheckout() {
    if (!modalSchool) return;
    setSubmitting(true);
    setFormError("");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId: modalSchool.id, plan }),
    });
    const data = await res.json();
    if (data.error) { setFormError(data.error); setSubmitting(false); return; }
    window.location.href = data.url;
  }

  async function handlePortal(school: School) {
    const sub = school.stripe_subscription;
    if (!sub || sub.stripe_customer_id?.startsWith("manual_")) {
      showToast("No real Stripe subscription. Use manual assign.", "error");
      return;
    }
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId: school.id }),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, "error"); return; }
    window.location.href = data.url;
  }

  async function handleCancel() {
    if (!cancelId) return;
    setCanceling(true);
    const res = await fetch(`/api/super-admin/billing/${cancelId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.error) { showToast(data.error, "error"); }
    else { showToast("Subscription canceled at period end."); }
    setCancelId(null);
    setCanceling(false);
    fetchBilling();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 text-red-500 p-6">
      <AlertCircle size={18} /> {error}
    </div>
  );

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle size={15} /> : <XCircle size={15} />}
          {toast.msg}
        </div>
      )}

      <BackButton href="/super-admin/dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscriptions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage Stripe plans for all schools</p>
        </div>
        <button
          onClick={fetchBilling}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md text-gray-600 transition-all"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Monthly Revenue",
            value: `$${(stats.totalMRR ?? 0).toLocaleString()}`,
sub: `$${((stats.totalMRR ?? 0) * 12).toLocaleString()} ARR`,

            icon: <TrendingUp size={18} />,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Active Plans",
            value: stats.activeSchools,
            sub: `${schools.length} total schools`,
            icon: <Zap size={18} />,
            color: "text-indigo-600 bg-indigo-50",
          },
          {
            label: "Past Due",
            value: stats.pastDueCount,
            sub: "Needs attention",
            icon: <AlertTriangle size={18} />,
            color: "text-red-500 bg-red-50",
          },
          {
            label: "No Plan",
            value: stats.noplanCount,
            sub: "Unmonetized",
            icon: <AlertCircle size={18} />,
            color: "text-amber-600 bg-amber-50",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-gray-900 font-bold text-xl leading-none">{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
              <p className="text-gray-400 text-xs">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { plan: "starter", price: 49, features: ["Up to 500 students", "5 teachers", "Basic analytics", "Email support"] },
          { plan: "growth", price: 99, features: ["Up to 2,000 students", "25 teachers", "Advanced analytics", "Priority support", "AI features"], popular: true },
          { plan: "enterprise", price: 199, features: ["Unlimited students", "Unlimited teachers", "Full analytics", "Dedicated support", "White label", "Custom domain"] },
        ].map(({ plan: p, price, features, popular }) => (
          <div key={p} className={`bg-white rounded-2xl border shadow-sm p-5 relative ${popular ? "border-indigo-300 shadow-indigo-100" : "border-gray-100"}`}>
            {popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                Most Popular
              </span>
            )}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${PLAN_STYLES[p]}`}>{p}</span>
              <span className="text-gray-900 font-bold text-lg">${price}<span className="text-gray-400 text-xs font-normal">/mo</span></span>
            </div>
            <ul className="space-y-1.5 mb-4">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                  <Check size={12} className="text-emerald-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400">
              {schools.filter((s) => s.stripe_subscription?.plan === p && s.stripe_subscription.status === "active").length} active schools
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schools..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 shadow-sm"
          />
        </div>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 shadow-sm"
        >
          <option value="all">All Plans</option>
          {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 shadow-sm"
        >
          <option value="all">All Statuses</option>
          <option value="none">No Plan</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3.5">School</th>
                <th className="text-left px-6 py-3.5">Users</th>
                <th className="text-left px-6 py-3.5">Plan</th>
                <th className="text-left px-6 py-3.5">Status</th>
                <th className="text-left px-6 py-3.5">MRR</th>
                <th className="text-left px-6 py-3.5">Renews</th>
                <th className="text-left px-6 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">No schools found</td>
                </tr>
              )}
              {filtered.map((school) => (
                <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                        {school.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium text-sm">{school.name}</p>
                        <p className="text-gray-400 text-xs">{school.city ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{school._count.users.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {school.stripe_subscription ? (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${PLAN_STYLES[school.stripe_subscription.plan] ?? "bg-gray-100 text-gray-500"}`}>
                        {school.stripe_subscription.plan}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No plan</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {school.stripe_subscription ? (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize flex items-center gap-1 w-fit ${STATUS_STYLES[school.stripe_subscription.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {STATUS_ICONS[school.stripe_subscription.status]}
                        {school.stripe_subscription.status.replace("_", " ")}
                      </span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-700 text-sm font-medium">
                    {school.stripe_subscription?.status === "active"
                      ? `$${PLAN_PRICES[school.stripe_subscription.plan] ?? 0}`
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {school.stripe_subscription
                      ? new Date(school.stripe_subscription.current_period_end).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                    {school.stripe_subscription?.cancel_at_period_end && (
                      <span className="ml-1.5 text-red-400">(cancels)</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(school)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium transition-colors"
                      >
                        {school.stripe_subscription ? "Change" : "Assign"}
                      </button>
                      {school.stripe_subscription?.stripe_customer_id && !school.stripe_subscription.stripe_customer_id.startsWith("manual_") && (
                        <button
                          onClick={() => handlePortal(school)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium transition-colors flex items-center gap-1"
                        >
                          <ExternalLink size={11} /> Portal
                        </button>
                      )}
                      {school.stripe_subscription && school.stripe_subscription.status !== "canceled" && !school.stripe_subscription.cancel_at_period_end && (
                        <button
                          onClick={() => setCancelId(school.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign / Checkout Modal */}
      {modalSchool && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 font-semibold text-lg">
                  {modalSchool.stripe_subscription ? "Change Plan" : "Assign Plan"}
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">{modalSchool.name}</p>
              </div>
              <button onClick={() => setModalSchool(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setModalMode("assign")}
                className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${modalMode === "assign" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                Manual Assign
              </button>
              <button
                onClick={() => setModalMode("checkout")}
                className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${modalMode === "checkout" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                Stripe Checkout
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
                <AlertCircle size={14} /> {formError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Plan</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400"
                >
                  {PLANS.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)} — ${PLAN_PRICES[p]}/mo
                    </option>
                  ))}
                </select>
              </div>
              {modalMode === "assign" && (
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>
              )}
              {modalMode === "checkout" && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-3 text-xs text-indigo-700">
                  This will open Stripe Checkout for real payment. The school will be charged <strong>${PLAN_PRICES[plan]}/month</strong>.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalSchool(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm transition-colors hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={modalMode === "assign" ? handleAssign : handleStripeCheckout}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : modalMode === "assign" ? (
                  <><Check size={14} /> Save Plan</>
                ) : (
                  <><CreditCard size={14} /> Open Checkout</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <CreditCard size={20} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-gray-900 font-semibold">Cancel Subscription?</h2>
                <p className="text-gray-400 text-xs mt-0.5">Access continues until the current period ends.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors">
                Keep Plan
              </button>
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {canceling ? "Canceling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}