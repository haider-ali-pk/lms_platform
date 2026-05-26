// src/app/super-admin/billing/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CreditCard, Check, X, Search, Zap, Building2 } from "lucide-react";
import BackButton from "@/components/BackButton";

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
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

const PLANS = ["starter", "growth", "enterprise"];
const STATUSES = ["active", "trialing", "past_due", "canceled", "unpaid"];

const PLAN_STYLES: Record<string, string> = {
  starter: "bg-blue-50 text-blue-600 border border-blue-200",
  growth: "bg-purple-50 text-purple-600 border border-purple-200",
  enterprise: "bg-amber-50 text-amber-600 border border-amber-200",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-50 text-green-600 border border-green-200",
  trialing: "bg-blue-50 text-blue-500 border border-blue-200",
  past_due: "bg-red-50 text-red-500 border border-red-200",
  canceled: "bg-gray-100 text-gray-500 border border-gray-200",
  unpaid: "bg-red-50 text-red-600 border border-red-200",
};

export default function BillingPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [filtered, setFiltered] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal
  const [modalSchool, setModalSchool] = useState<School | null>(null);
  const [plan, setPlan] = useState("starter");
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Cancel confirm
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  async function fetchBilling() {
    setLoading(true);
    const res = await fetch("/api/super-admin/billing", {
      ` },
    });
    const data = await res.json();
    if (data.error) { setError(data.error); setLoading(false); return; }
    setSchools(data.schools);
    setFiltered(data.schools);
    setLoading(false);
  }

  useEffect(() => { fetchBilling(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(schools.filter((s) =>
      s.name.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q)
    ));
  }, [search, schools]);

  function openModal(school: School) {
    setModalSchool(school);
    setPlan(school.stripe_subscription?.plan ?? "starter");
    setStatus(school.stripe_subscription?.status ?? "active");
    setFormError("");
  }

  async function handleAssign() {
    if (!modalSchool) return;
    setSubmitting(true);
    setFormError("");
    const res = await fetch(`/api/super-admin/billing/${modalSchool.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan, status }),
    });
    const data = await res.json();
    if (data.error) { setFormError(data.error); setSubmitting(false); return; }
    setModalSchool(null);
    fetchBilling();
    setSubmitting(false);
  }

  async function handleCancel() {
    if (!cancelId) return;
    setCanceling(true);
    await fetch(`/api/super-admin/billing/${cancelId}`, {
      method: "DELETE"` },
    });
    setCancelId(null);
    setCanceling(false);
    fetchBilling();
  }

  // Summary stats
  const totalRevenue = schools.reduce((sum, s) => {
    if (!s.stripe_subscription || s.stripe_subscription.status !== "active") return sum;
    const prices: Record<string, number> = { starter: 200, growth: 350, enterprise: 500 };
    return sum + (prices[s.stripe_subscription.plan] ?? 0);
  }, 0);

  const activeCount = schools.filter((s) => s.stripe_subscription?.status === "active").length;
  const noplanCount = schools.filter((s) => !s.stripe_subscription).length;

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
      <BackButton href="/super-admin/dashboard" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscriptions</h1>
        <p className="text-gray-500 text-sm mt-1">Manage plans for all schools on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Monthly Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: <CreditCard size={18} />, color: "text-green-600 bg-green-50" },
          { label: "Active Plans", value: activeCount, icon: <Zap size={18} />, color: "text-indigo-600 bg-indigo-50" },
          { label: "Total Schools", value: schools.length, icon: <Building2 size={18} />, color: "text-blue-600 bg-blue-50" },
          { label: "No Plan", value: noplanCount, icon: <AlertCircle size={18} />, color: "text-amber-600 bg-amber-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-gray-900 font-bold text-lg">{s.value}</p>
              <p className="text-gray-400 text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search schools..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3">School</th>
                <th className="text-left px-6 py-3">Users</th>
                <th className="text-left px-6 py-3">Plan</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Renews</th>
                <th className="text-left px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((school) => (
                <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {school.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{school.name}</p>
                        <p className="text-gray-400 text-xs">{school.city ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{school._count.users.toLocaleString()}</td>
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
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_STYLES[school.stripe_subscription.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {school.stripe_subscription.status.replace("_", " ")}
                      </span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {school.stripe_subscription
                      ? new Date(school.stripe_subscription.current_period_end).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(school)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium transition-colors"
                      >
                        {school.stripe_subscription ? "Change Plan" : "Assign Plan"}
                      </button>
                      {school.stripe_subscription && school.stripe_subscription.status !== "canceled" && (
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

      {/* Assign / Change Plan Modal */}
      {modalSchool && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 font-semibold text-lg">Assign Plan</h2>
                <p className="text-gray-400 text-xs mt-0.5">{modalSchool.name}</p>
              </div>
              <button onClick={() => setModalSchool(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <X size={15} />
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
                  {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)} {p === "starter" ? "— $200/mo" : p === "growth" ? "— $350/mo" : "— $500/mo"}</option>)}
                </select>
              </div>
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
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalSchool(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={14} /> Save Plan</>}
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
                <p className="text-gray-400 text-xs mt-0.5">The school will lose access at period end.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm transition-colors">
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
