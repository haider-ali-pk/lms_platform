"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard, Users, GraduationCap, Zap, Check,
  AlertCircle, ExternalLink, TrendingUp, Shield,
  CheckCircle, XCircle, Clock, ChevronRight
} from "lucide-react";
import BackButton from "@/components/BackButton";

interface BillingData {
  school: { id: string; name: string; city: string | null };
  plan: string;
  status: string;
  seatLimit: number;
  teacherLimit: number;
  studentCount: number;
  teacherCount: number;
  monthlyAmount: number;
  sponsoredAI: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

const PLANS = [
  {
    key: "trial",
    name: "Free Trial",
    price: 0,
    seats: 30,
    teachers: 2,
    ai: "None",
    features: ["30 student seats", "2 teachers", "Basic LMS", "Quizzes", "7-day trial"],
    color: "border-gray-200",
    badge: "bg-gray-100 text-gray-600",
  },
  {
    key: "starter",
    name: "Starter",
    price: 149,
    seats: 100,
    teachers: 10,
    ai: "Free AI (10 msgs/mo)",
    features: ["100 student seats", "10 teachers", "Gradebook", "Attendance", "Free AI for students"],
    color: "border-blue-200",
    badge: "bg-blue-50 text-blue-600",
    popular: false,
  },
  {
    key: "growth",
    name: "Growth",
    price: 499,
    seats: 500,
    teachers: 50,
    ai: "Basic AI (200 msgs/mo)",
    features: ["500 student seats", "50 teachers", "Live Classes", "Analytics", "Basic AI for students"],
    color: "border-indigo-300",
    badge: "bg-indigo-50 text-indigo-600",
    popular: true,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 999,
    seats: 999999,
    teachers: 999999,
    ai: "Pro AI (Unlimited)",
    features: ["Unlimited seats", "Unlimited teachers", "AI Grader", "White Label", "Pro AI for students"],
    color: "border-amber-200",
    badge: "bg-amber-50 text-amber-600",
  },
];

const STATUS_UI: Record<string, { label: string; class: string; icon: React.ReactElement }> = {
  active: { label: "Active", class: "bg-emerald-50 text-emerald-600 border border-emerald-200", icon: <CheckCircle size={12} /> },
  trialing: { label: "Trialing", class: "bg-blue-50 text-blue-500 border border-blue-200", icon: <Clock size={12} /> },
  past_due: { label: "Past Due", class: "bg-red-50 text-red-500 border border-red-200", icon: <AlertCircle size={12} /> },
  canceled: { label: "Canceled", class: "bg-gray-100 text-gray-500 border border-gray-200", icon: <XCircle size={12} /> },
  none: { label: "No Plan", class: "bg-gray-100 text-gray-400 border border-gray-200", icon: <XCircle size={12} /> },
};

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch("/api/admin/billing")
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); setLoading(false); });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) { showToast("Subscription updated successfully!"); window.history.replaceState({}, "", "/admin/billing"); }
    if (params.get("canceled")) { showToast("Checkout was canceled.", "error"); window.history.replaceState({}, "", "/admin/billing"); }
  }, []);

  async function handleUpgrade(plan: string) {
    setUpgrading(plan);
    const res = await fetch("/api/stripe/school-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const d = await res.json();
    if (d.error) { showToast(d.error, "error"); setUpgrading(null); return; }
    window.location.href = d.url;
  }

  async function handlePortal() {
    if (!data?.stripeCustomerId || data.stripeCustomerId.startsWith("manual_")) {
      showToast("No active Stripe subscription to manage.", "error"); return;
    }
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId: data.school.id }),
    });
    const d = await res.json();
    if (d.error) { showToast(d.error, "error"); return; }
    window.location.href = d.url;
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="flex items-center gap-2 text-red-500 p-6"><AlertCircle size={18} /> {error}</div>;
  if (!data) return null;

  const currentPlan = PLANS.find((p) => p.key === data.plan) ?? PLANS[0];
  const statusUI = STATUS_UI[data.status] ?? STATUS_UI["none"];
  const seatUsagePct = data.seatLimit >= 999999 ? 0 : Math.round((data.studentCount / data.seatLimit) * 100);
  const teacherUsagePct = data.teacherLimit >= 999999 ? 0 : Math.round((data.teacherCount / data.teacherLimit) * 100);

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? <CheckCircle size={15} /> : <XCircle size={15} />}
          {toast.msg}
        </div>
      )}

      <BackButton href="/admin/dashboard" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Billing</h1>
          <p className="text-gray-500 text-sm mt-1">{data.school.name} — Manage your subscription</p>
        </div>
        {data.stripeCustomerId && !data.stripeCustomerId.startsWith("manual_") && (
          <button onClick={handlePortal} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md text-gray-600 transition-all">
            <ExternalLink size={14} /> Manage in Stripe
          </button>
        )}
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Shield size={24} className="text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{currentPlan.name} Plan</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${statusUI.class}`}>
                  {statusUI.icon} {statusUI.label}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                {currentPlan.price === 0 ? "Free" : `$${currentPlan.price}/month`}
                {data.cancelAtPeriodEnd && <span className="ml-2 text-red-400 text-xs">(cancels at period end)</span>}
              </p>
              {data.currentPeriodEnd && (
                <p className="text-gray-400 text-xs mt-1">
                  Renews {new Date(data.currentPeriodEnd).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">${currentPlan.price}<span className="text-gray-400 text-sm font-normal">/mo</span></p>
            <p className="text-xs text-gray-400 mt-1">Students get <span className="font-medium text-indigo-600">{data.sponsoredAI === "none" ? "No AI" : `${data.sponsoredAI.charAt(0).toUpperCase() + data.sponsoredAI.slice(1)} AI`}</span> sponsored</p>
          </div>
        </div>

        {/* Usage bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={14} /> Student Seats
              </div>
              <span className="text-sm font-medium text-gray-900">
                {data.studentCount} / {data.seatLimit >= 999999 ? "∞" : data.seatLimit}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${seatUsagePct > 90 ? "bg-red-500" : seatUsagePct > 70 ? "bg-amber-500" : "bg-indigo-500"}`}
                style={{ width: `${Math.min(seatUsagePct, 100)}%` }}
              />
            </div>
            {seatUsagePct > 80 && data.seatLimit < 999999 && (
              <p className="text-xs text-amber-600 mt-1">Running low on seats — consider upgrading</p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <GraduationCap size={14} /> Teacher Seats
              </div>
              <span className="text-sm font-medium text-gray-900">
                {data.teacherCount} / {data.teacherLimit >= 999999 ? "∞" : data.teacherLimit}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${teacherUsagePct > 90 ? "bg-red-500" : teacherUsagePct > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(teacherUsagePct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <h2 className="text-lg font-semibold text-gray-900">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === data.plan;
          return (
            <div key={plan.key} className={`bg-white rounded-2xl border-2 shadow-sm p-5 relative flex flex-col ${isCurrent ? "border-indigo-400 shadow-indigo-100" : plan.color}`}>
              {plan.popular && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium">Most Popular</span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-medium">Current Plan</span>
              )}
              <div className="mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${plan.badge}`}>{plan.name}</span>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                  {plan.price > 0 && <span className="text-gray-400 text-sm font-normal">/mo</span>}
                </p>
              </div>
              <ul className="space-y-2 mb-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <div className="text-xs text-indigo-600 font-medium mb-3 flex items-center gap-1">
                <Zap size={11} /> {plan.ai}
              </div>
              {isCurrent ? (
                <div className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-400 text-sm text-center font-medium border border-gray-200">
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={!!upgrading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {upgrading === plan.key ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>{plan.price > (currentPlan.price) ? "Upgrade" : "Switch"} <ChevronRight size={14} /></>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* AI sponsorship info */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold text-sm">Sponsored AI for Your Students</h3>
            <p className="text-gray-600 text-xs mt-1">
              Your current <span className="font-medium">{currentPlan.name}</span> plan gives all your students <span className="font-medium text-indigo-600">{data.sponsoredAI === "none" ? "no sponsored AI access" : `${data.sponsoredAI} AI tier automatically`}</span>. Upgrade your school plan to give students better AI access at no extra cost to them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}