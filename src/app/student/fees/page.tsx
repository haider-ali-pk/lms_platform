"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign, AlertCircle, CheckCircle, XCircle,
  Clock, CreditCard, ChevronRight
} from "lucide-react";
import StudentSidebar from "@/components/StudentSidebar";
import BackButton from "@/components/BackButton";


interface FeePayment {
  id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: string;
  notes: string | null;
  fee_template: { title: string; grade: string } | null;
}

interface FeesData {
  fees: FeePayment[];
  totalDue: number;
  totalPaid: number;
  hasOverdue: boolean;
  nextDue: FeePayment | null;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  pending: "bg-amber-50 text-amber-600 border border-amber-200",
  overdue: "bg-red-50 text-red-600 border border-red-200",
};

const STATUS_ICONS: Record<string, React.ReactElement> = {
  paid: <CheckCircle size={12} />,
  pending: <Clock size={12} />,
  overdue: <XCircle size={12} />,
};

export default function StudentFeesPage() {
  const [data, setData] = useState<FeesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch("/api/student/fees")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); setLoading(false); });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) { showToast("Payment successful! Your fee has been marked as paid."); window.history.replaceState({}, "", "/student/fees"); }
    if (params.get("canceled")) { showToast("Payment was canceled.", "error"); window.history.replaceState({}, "", "/student/fees"); }
  }, []);

  async function handlePay(feeId: string) {
    setPaying(feeId);
    const res = await fetch("/api/stripe/fee-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fee_id: feeId }),
    });
    const d = await res.json();
    if (d.error) { showToast(d.error, "error"); setPaying(null); return; }
    window.location.href = d.url;
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="flex items-center gap-2 text-red-500 p-6"><AlertCircle size={18} /> {error}</div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? <CheckCircle size={15} /> : <XCircle size={15} />} {toast.msg}
        </div>
      )}

      <BackButton href="/student/dashboard" />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Fees</h1>
        <p className="text-gray-500 text-sm mt-1">View and pay your school fees</p>
      </div>

      {/* Alert for overdue */}
      {data.hasOverdue && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-semibold text-sm">You have overdue fees</p>
            <p className="text-red-600 text-xs mt-0.5">Please pay immediately to avoid account suspension.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <DollarSign size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-gray-900 font-bold text-xl">${data.totalDue}</p>
            <p className="text-gray-500 text-xs mt-1">Total Due</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-gray-900 font-bold text-xl">${data.totalPaid}</p>
            <p className="text-gray-500 text-xs mt-1">Total Paid</p>
          </div>
        </div>
      </div>

      {/* Fee list */}
      <div className="space-y-3">
        {data.fees.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
            No fee records found.
          </div>
        )}
        {data.fees.map((fee) => (
          <div key={fee.id} className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center justify-between gap-4 ${fee.status === "overdue" ? "border-red-200" : "border-gray-100"}`}>
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${fee.status === "paid" ? "bg-emerald-50" : fee.status === "overdue" ? "bg-red-50" : "bg-amber-50"}`}>
                <CreditCard size={18} className={fee.status === "paid" ? "text-emerald-500" : fee.status === "overdue" ? "text-red-500" : "text-amber-500"} />
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-sm">{fee.fee_template?.title ?? "School Fee"}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Due {new Date(fee.due_date).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                  {fee.notes && <span className="ml-2 text-indigo-500">· {fee.notes}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-gray-900 font-bold text-lg">${fee.amount}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 justify-end ${STATUS_STYLES[fee.status]}`}>
                  {STATUS_ICONS[fee.status]} {fee.status}
                </span>
              </div>
              {fee.status !== "paid" && (
                <button
                  onClick={() => handlePay(fee.id)}
                  disabled={paying === fee.id}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {paying === fee.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Pay Now <ChevronRight size={14} /></>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}