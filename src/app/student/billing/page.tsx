"use client";

import React, { useEffect, useState } from "react";
import {
  Zap, Check, AlertCircle, CheckCircle, XCircle,
  TrendingUp, MessageSquare, BookOpen, Target, ChevronRight
} from "lucide-react";
import BackButton from "@/components/BackButton";

interface BillingData {
  plan: string;
  status: string;
  messagesUsed: number;
  messagesLimit: number;
  periodResetAt: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
}

const AI_PLANS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    messages: 10,
    features: ["10 AI messages/month", "Basic AI chat", "General Q&A"],
    color: "border-gray-200",
    badge: "bg-gray-100 text-gray-600",
  },
  {
    key: "basic",
    name: "Basic",
    price: 9,
    messages: 200,
    features: ["200 AI messages/month", "AI Chat", "Homework Helper", "Step-by-step solutions"],
    color: "border-blue-200",
    badge: "bg-blue-50 text-blue-600",
  },
  {
    key: "pro",
    name: "Pro",
    price: 19,
    messages: 999999,
    features: ["Unlimited AI messages", "Everything in Basic", "Exam Predictor", "AI Study Plan", "Voice Notes"],
    color: "border-indigo-300",
    badge: "bg-indigo-50 text-indigo-600",
    popular: true,
  },
  {
    key: "booster",
    name: "Exam Booster",
    price: 4.99,
    messages: 500,
    features: ["500 AI messages", "30-day access", "One-time purchase", "Exam Predictor included"],
    color: "border-amber-200",
    badge: "bg-amber-50 text-amber-600",
    oneTime: true,
  },
];

export default function StudentBillingPage() {
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
    fetch("/api/student/billing")
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); setLoading(false); });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) { showToast("AI plan upgraded successfully!"); window.history.replaceState({}, "", "/student/billing"); }
    if (params.get("canceled")) { showToast("Checkout was canceled.", "error"); window.history.replaceState({}, "", "/student/billing"); }
  }, []);

  async function handleUpgrade(plan: string) {
    setUpgrading(plan);
    const res = await fetch("/api/stripe/student-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const d = await res.json();
    if (d.error) { 
      showToast(d.error, "error"); 
      setUpgrading(null); 
      return; 
    }
    if (!d.url) {
      showToast("No checkout URL returned", "error");
      setUpgrading(null);
      return;
    }
    window.location.href = d.url;
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="flex items-center gap-2 text-red-500 p-6"><AlertCircle size={18} /> {error}</div>;
  if (!data) return null;

  const usagePct = data.messagesLimit >= 999999 ? 5 : Math.round((data.messagesUsed / data.messagesLimit) * 100);
  const currentPlan = AI_PLANS.find((p) => p.key === data.plan) ?? AI_PLANS[0];

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? <CheckCircle size={15} /> : <XCircle size={15} />}
          {toast.msg}
        </div>
      )}

      <BackButton href="/student/dashboard" />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Plan</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your AI usage and upgrade your plan</p>
      </div>

      {/* Current usage card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <MessageSquare size={22} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{currentPlan.name} Plan</h2>
              <p className="text-gray-400 text-xs">
                Resets {new Date(data.periodResetAt).toLocaleDateString("en-US", { day: "numeric", month: "long" })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {data.messagesUsed}<span className="text-gray-400 text-sm font-normal"> / {data.messagesLimit >= 999999 ? "∞" : data.messagesLimit}</span>
            </p>
            <p className="text-xs text-gray-400">messages used</p>
          </div>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${usagePct > 90 ? "bg-red-500" : usagePct > 70 ? "bg-amber-500" : "bg-indigo-500"}`}
            style={{ width: `${Math.min(usagePct, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">{usagePct}% used</p>
          {usagePct > 80 && data.messagesLimit < 999999 && (
            <p className="text-xs text-amber-600 font-medium">Running low — upgrade for more</p>
          )}
        </div>

        {data.messagesUsed >= data.messagesLimit && data.messagesLimit < 999999 && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            <AlertCircle size={15} /> You've used all your AI messages this month. Upgrade to continue.
          </div>
        )}
      </div>

      {/* What you can do */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: <MessageSquare size={18} />, title: "AI Chat", desc: "Ask any question", req: "free", color: "bg-indigo-50 text-indigo-600" },
          { icon: <BookOpen size={18} />, title: "Homework Helper", desc: "Step-by-step solutions", req: "basic", color: "bg-blue-50 text-blue-600" },
          { icon: <Target size={18} />, title: "Exam Predictor", desc: "Predict your score", req: "pro", color: "bg-purple-50 text-purple-600" },
        ].map((feature) => {
          const planRank: Record<string, number> = { free: 0, basic: 1, pro: 2, booster: 1 };
          const hasAccess = (planRank[data.plan] ?? 0) >= (planRank[feature.req] ?? 0);
          return (
            <div key={feature.title} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 ${!hasAccess ? "opacity-60" : ""}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${feature.color}`}>
                {feature.icon}
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium text-sm">{feature.title}</p>
                <p className="text-gray-400 text-xs">{feature.desc}</p>
              </div>
              {hasAccess ? (
                <CheckCircle size={16} className="text-emerald-500" />
              ) : (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                  {feature.req.charAt(0).toUpperCase() + feature.req.slice(1)}+
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Plan cards */}
      <h2 className="text-lg font-semibold text-gray-900">Upgrade Your AI</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {AI_PLANS.map((plan) => {
          const isCurrent = plan.key === data.plan;
          return (
            <div key={plan.key} className={`bg-white rounded-2xl border-2 shadow-sm p-5 relative flex flex-col ${isCurrent ? "border-indigo-400 shadow-indigo-100" : plan.color}`}>
              {plan.popular && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium">Most Popular</span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-medium">Current Plan</span>
              )}
              {plan.oneTime && (
                <span className="absolute -top-3 right-4 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium">One-time</span>
              )}
              <div className="mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${plan.badge}`}>{plan.name}</span>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                  {plan.price > 0 && <span className="text-gray-400 text-sm font-normal">{plan.oneTime ? " once" : "/mo"}</span>}
                </p>
              </div>
              <ul className="space-y-2 mb-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-400 text-sm text-center border border-gray-200">Current Plan</div>
              ) : plan.key === "free" ? (
                <div className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-400 text-sm text-center border border-gray-200">Default Plan</div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={!!upgrading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {upgrading === plan.key ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>{plan.oneTime ? "Buy Booster" : "Upgrade"} <ChevronRight size={14} /></>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}