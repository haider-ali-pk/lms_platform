"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign, Users, AlertCircle, CheckCircle, Plus,
  RefreshCw, Search, XCircle, ChevronDown, Zap,
  Calendar, Edit, Trash2, X, Check, TrendingUp
} from "lucide-react";
import BackButton from "@/components/BackButton";

interface FeeTemplate {
  id: string;
  grade: string;
  amount: number;
  due_day: number;
  title: string;
  is_active: boolean;
}

interface FeePayment {
  id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: string;
  notes: string | null;
  student: { id: string; first_name: string; last_name: string; email: string; grade: string | null };
  fee_template: { title: string; grade: string } | null;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  grade: string | null;
  is_active: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  pending: "bg-amber-50 text-amber-600 border border-amber-200",
  overdue: "bg-red-50 text-red-600 border border-red-200",
};

const STATUS_ICONS: Record<string, React.ReactElement> = {
  paid: <CheckCircle size={11} />,
  pending: <AlertCircle size={11} />,
  overdue: <XCircle size={11} />,
};

export default function AdminFeesPage() {
  const [templates, setTemplates] = useState<FeeTemplate[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState({ totalCollected: 0, totalPending: 0, totalOverdue: 0, overdueCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState<"payments" | "templates">("payments");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Template modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<FeeTemplate | null>(null);
  const [tGrade, setTGrade] = useState("");
  const [tAmount, setTAmount] = useState("");
  const [tDueDay, setTDueDay] = useState("15");
  const [tTitle, setTTitle] = useState("");
  const [tSubmitting, setTSubmitting] = useState(false);

  // Generate modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genTemplateId, setGenTemplateId] = useState("");
  const [genMonth, setGenMonth] = useState(String(new Date().getMonth() + 1));
  const [genYear, setGenYear] = useState(String(new Date().getFullYear()));
  const [generating, setGenerating] = useState(false);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignAmount, setAssignAmount] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assigning, setAssigning] = useState(false);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchData() {
    setLoading(true);
    const res = await fetch("/api/admin/fees");
    const d = await res.json();
    if (d.error) { showToast(d.error, "error"); setLoading(false); return; }
    setTemplates(d.templates);
    setPayments(d.payments);
    setStudents(d.students);
    setStats({ totalCollected: d.totalCollected, totalPending: d.totalPending, totalOverdue: d.totalOverdue, overdueCount: d.overdueCount });
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${p.student.first_name} ${p.student.last_name}`.toLowerCase().includes(q) || p.student.email.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function handleSaveTemplate() {
    if (!tGrade || !tAmount || !tDueDay || !tTitle) { showToast("All fields required", "error"); return; }
    setTSubmitting(true);
    if (editTemplate) {
      const res = await fetch(`/api/admin/fees/${editTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: tGrade, amount: tAmount, due_day: tDueDay, title: tTitle }),
      });
      const d = await res.json();
      if (d.error) { showToast(d.error, "error"); setTSubmitting(false); return; }
      showToast("Template updated!");
    } else {
      const res = await fetch("/api/admin/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: tGrade, amount: tAmount, due_day: tDueDay, title: tTitle }),
      });
      const d = await res.json();
      if (d.error) { showToast(d.error, "error"); setTSubmitting(false); return; }
      showToast("Template created!");
    }
    setShowTemplateModal(false);
    setEditTemplate(null);
    fetchData();
    setTSubmitting(false);
  }

  async function handleDeleteTemplate(id: string) {
    const res = await fetch(`/api/admin/fees/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (d.error) { showToast(d.error, "error"); return; }
    showToast("Template deleted!");
    fetchData();
  }

  async function handleGenerate() {
    if (!genTemplateId) { showToast("Select a template", "error"); return; }
    setGenerating(true);
    const res = await fetch("/api/admin/fees/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: genTemplateId, month: parseInt(genMonth), year: parseInt(genYear) }),
    });
    const d = await res.json();
    if (d.error) { showToast(d.error, "error"); setGenerating(false); return; }
    showToast(`Generated ${d.created} fees, skipped ${d.skipped} existing`);
    setShowGenerateModal(false);
    fetchData();
    setGenerating(false);
  }

  async function handleAssign() {
    if (!assignStudentId || !assignAmount || !assignDueDate) { showToast("All fields required", "error"); return; }
    setAssigning(true);
    const res = await fetch("/api/admin/fees/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: assignStudentId, amount: assignAmount, due_date: assignDueDate, notes: assignNotes }),
    });
    const d = await res.json();
    if (d.error) { showToast(d.error, "error"); setAssigning(false); return; }
    showToast("Fee assigned!");
    setShowAssignModal(false);
    fetchData();
    setAssigning(false);
  }

  async function handleUnblock(studentId: string) {
    const res = await fetch("/api/admin/fees/unblock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId }),
    });
    const d = await res.json();
    if (d.error) { showToast(d.error, "error"); return; }
    showToast("Student unblocked!");
    fetchData();
  }

  function openEditTemplate(t: FeeTemplate) {
    setEditTemplate(t);
    setTGrade(t.grade);
    setTAmount(String(t.amount));
    setTDueDay(String(t.due_day));
    setTTitle(t.title);
    setShowTemplateModal(true);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? <CheckCircle size={15} /> : <XCircle size={15} />} {toast.msg}
        </div>
      )}

      <BackButton href="/admin/dashboard" />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage student fees, templates, and payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGenerateModal(true)} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">
            <Zap size={14} /> Generate Fees
          </button>
          <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md text-gray-600 transition-all">
            <Plus size={14} /> Assign Fee
          </button>
          <button onClick={fetchData} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md text-gray-600 transition-all">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Collected", value: `$${stats.totalCollected.toLocaleString()}`, icon: <TrendingUp size={18} />, color: "text-emerald-600 bg-emerald-50" },
          { label: "Pending", value: `$${stats.totalPending.toLocaleString()}`, icon: <AlertCircle size={18} />, color: "text-amber-600 bg-amber-50" },
          { label: "Overdue", value: `$${stats.totalOverdue.toLocaleString()}`, icon: <XCircle size={18} />, color: "text-red-500 bg-red-50" },
          { label: "Overdue Students", value: stats.overdueCount, icon: <Users size={18} />, color: "text-red-600 bg-red-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-gray-900 font-bold text-xl leading-none">{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 w-fit shadow-sm">
        {(["payments", "templates"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "payments" && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 shadow-sm" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 shadow-sm">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3.5">Student</th>
                    <th className="text-left px-6 py-3.5">Grade</th>
                    <th className="text-left px-6 py-3.5">Amount</th>
                    <th className="text-left px-6 py-3.5">Due Date</th>
                    <th className="text-left px-6 py-3.5">Status</th>
                    <th className="text-left px-6 py-3.5">Paid At</th>
                    <th className="text-left px-6 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">No payments found</td></tr>
                  )}
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                            {p.student.first_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium text-sm">{p.student.first_name} {p.student.last_name}</p>
                            <p className="text-gray-400 text-xs">{p.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{p.student.grade ?? "—"}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium text-sm">${p.amount}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{new Date(p.due_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize flex items-center gap-1 w-fit ${STATUS_STYLES[p.status]}`}>
                          {STATUS_ICONS[p.status]} {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {p.status === "overdue" && (
                          <button onClick={() => handleUnblock(p.student.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-medium transition-colors">
                            Unblock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setEditTemplate(null); setTGrade(""); setTAmount(""); setTDueDay("15"); setTTitle(""); setShowTemplateModal(true); }}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">
              <Plus size={14} /> New Template
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.length === 0 && (
              <div className="col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
                No fee templates yet. Create one to get started.
              </div>
            )}
            {templates.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-gray-900 font-semibold text-sm">{t.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">Grade {t.grade} · Due day {t.due_day}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditTemplate(t)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                      <Edit size={12} />
                    </button>
                    <button onClick={() => handleDeleteTemplate(t.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">${t.amount}<span className="text-gray-400 text-sm font-normal">/mo</span></p>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${t.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                  {t.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 font-semibold text-lg">{editTemplate ? "Edit Template" : "New Fee Template"}</h2>
              <button onClick={() => setShowTemplateModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"><X size={15} /></button>
            </div>
            {[
              { label: "Title", value: tTitle, set: setTTitle, placeholder: "Monthly Fee - Grade 5" },
              { label: "Grade", value: tGrade, set: setTGrade, placeholder: "5, 10, O-Level..." },
              { label: "Amount ($)", value: tAmount, set: setTAmount, placeholder: "80" },
              { label: "Due Day (1-28)", value: tDueDay, set: setTDueDay, placeholder: "15" },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">{label}</label>
                <input value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400" />
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setShowTemplateModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveTemplate} disabled={tSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {tSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={14} /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 font-semibold text-lg">Generate Fees</h2>
              <button onClick={() => setShowGenerateModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"><X size={15} /></button>
            </div>
            <p className="text-gray-500 text-xs">Auto-generate fee records for all students in the selected grade template.</p>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Fee Template</label>
              <select value={genTemplateId} onChange={(e) => setGenTemplateId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400">
                <option value="">Select template...</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.title} — ${t.amount}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Month</label>
                <select value={genMonth} onChange={(e) => setGenMonth(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400">
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Year</label>
                <input value={genYear} onChange={(e) => setGenYear(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowGenerateModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleGenerate} disabled={generating}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {generating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Zap size={14} /> Generate</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 font-semibold text-lg">Assign Fee to Student</h2>
              <button onClick={() => setShowAssignModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"><X size={15} /></button>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Student</label>
              <select value={assignStudentId} onChange={(e) => setAssignStudentId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400">
                <option value="">Select student...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — Grade {s.grade ?? "?"}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Amount ($)</label>
              <input value={assignAmount} onChange={(e) => setAssignAmount(e.target.value)} placeholder="80"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Due Date</label>
              <input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Notes (optional)</label>
              <input value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} placeholder="Scholarship, partial fee..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleAssign} disabled={assigning}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {assigning ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={14} /> Assign</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}