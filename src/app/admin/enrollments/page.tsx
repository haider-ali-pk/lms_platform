"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface EnrollmentRequest {
  id: string;
  student_name: string;
  parent_name: string;
  phone: string;
  grade: string;
  date_of_birth: string;
  status: string;
  notes: string | null;
  created_at: string;
  school: { id: string; name: string };
}

export default function AdminEnrollmentsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<EnrollmentRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page) });
    if (statusFilter) p.set("status", statusFilter);
    const res = await fetch("/api/admin/enrollments?" + p.toString());
    const d = await res.json();
    setRequests(d.requests || []);
    setTotal(d.total || 0);
    setPages(d.pages || 1);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (status: string) => {
    if (!modal) return;
    setSaving(true);
    await fetch("/api/admin/enrollments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: modal.id, status, notes }),
    });
    setSaving(false);
    setModal(null);
    setNotes("");
    load();
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });

  const badge: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Enrollment Requests</h1>
          <p className="text-sm text-gray-500">{total} total applications</p>
        </div>
        <a href="/enroll" target="_blank" rel="noreferrer" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
          View Public Form
        </a>
      </div>

      <div className="flex gap-2 mb-5">
        {["", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={"px-4 py-1.5 rounded-lg text-sm font-medium capitalize " + (statusFilter === s ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600")}
          >
            {s === "" ? "All" : s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-center py-16 text-sm text-gray-400">No enrollment requests found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Parent</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">School</th>
                  <th className="px-4 py-3 text-left">Grade</th>
                  <th className="px-4 py-3 text-left">DOB</th>
                  <th className="px-4 py-3 text-left">Applied</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{r.student_name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.parent_name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{r.school.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.grade}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(r.date_of_birth)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmt(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={"px-2 py-0.5 rounded-full text-xs font-medium capitalize " + (badge[r.status] || "bg-gray-100 text-gray-600")}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "pending" ? (
                        <button onClick={() => { setModal(r); setNotes(""); }} className="text-indigo-600 hover:underline text-xs font-medium">
                          Review
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">Previous</button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Review Application</h2>
              <p className="text-sm text-gray-500">{modal.student_name}</p>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-400">Student</p><p className="font-medium">{modal.student_name}</p></div>
                <div><p className="text-xs text-gray-400">Parent</p><p className="font-medium">{modal.parent_name}</p></div>
                <div><p className="text-xs text-gray-400">Phone</p><p className="font-medium">{modal.phone}</p></div>
                <div><p className="text-xs text-gray-400">Grade</p><p className="font-medium">{modal.grade}</p></div>
                <div><p className="text-xs text-gray-400">School</p><p className="font-medium">{modal.school.name}</p></div>
                <div><p className="text-xs text-gray-400">DOB</p><p className="font-medium">{fmt(modal.date_of_birth)}</p></div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add a note..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => doAction("approved")} disabled={saving} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">Approve</button>
              <button onClick={() => doAction("rejected")} disabled={saving} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50">Reject</button>
              <button onClick={() => setModal(null)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
