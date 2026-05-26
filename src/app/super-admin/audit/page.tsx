// src/app/super-admin/audit-logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Search, AlertCircle, ChevronLeft, ChevronRight, ShieldCheck, Activity } from "lucide-react";
import BackButton from "@/components/BackButton";

interface Log {
  id: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  ip: string | null;
  created_at: string;
  user: { first_name: string; last_name: string; email: string; role: string } | null;
  school: { name: string } | null;
  meta: any;
}

interface School { id: string; name: string; }

const ACTION_COLOR: Record<string, string> = {
  login: "bg-blue-50 text-blue-600 border border-blue-200",
  logout: "bg-gray-100 text-gray-500 border border-gray-200",
  created: "bg-green-50 text-green-600 border border-green-200",
  updated: "bg-amber-50 text-amber-600 border border-amber-200",
  deleted: "bg-red-50 text-red-500 border border-red-200",
  upgraded: "bg-purple-50 text-purple-600 border border-purple-200",
};

function getActionColor(action: string) {
  const key = Object.keys(ACTION_COLOR).find((k) => action.includes(k));
  return key ? ACTION_COLOR[key] : "bg-gray-100 text-gray-500 border border-gray-200";
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  async function fetchLogs(p = page) {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(p), limit: "25",
      ...(search && { search }),
      ...(schoolFilter && { school_id: schoolFilter }),
    });
    const res = await fetch(`/api/super-admin/audit-logs?${params}`, {
      ` },
    });
    const data = await res.json();
    if (data.error) { setError(data.error); setLoading(false); return; }
    setLogs(data.logs);
    setTotal(data.total);
    setTotalPages(data.pages);
    setLoading(false);
  }

  async function fetchSchools() {
    const res = await fetch("/api/super-admin/schools", { ` } });
    const data = await res.json();
    if (!data.error) setSchools(data.schools);
  }

  useEffect(() => { fetchSchools(); }, []);
  useEffect(() => { fetchLogs(page); }, [page, schoolFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchLogs(1);
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      <BackButton href="/super-admin/dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total events recorded</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-600 px-3 py-2 rounded-xl text-sm font-medium">
          <ShieldCheck size={15} /> Read Only
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Activity size={18} />
        </div>
        <div>
          <p className="text-gray-900 font-bold text-lg">{total.toLocaleString()}</p>
          <p className="text-gray-400 text-xs">Total audit events</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action or entity..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 shadow-sm"
          />
        </form>
        <select
          value={schoolFilter}
          onChange={(e) => { setSchoolFilter(e.target.value); setPage(1); }}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 shadow-sm"
        >
          <option value="">All Schools</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-500"><AlertCircle size={18} /> {error}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3">Action</th>
                  <th className="text-left px-6 py-3">User</th>
                  <th className="text-left px-6 py-3">School</th>
                  <th className="text-left px-6 py-3">Entity</th>
                  <th className="text-left px-6 py-3">IP</th>
                  <th className="text-left px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-400">No audit logs found.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.user ? (
                          <div>
                            <p className="text-gray-900 font-medium text-xs">{log.user.first_name} {log.user.last_name}</p>
                            <p className="text-gray-400 text-xs">{log.user.email}</p>
                          </div>
                        ) : <span className="text-gray-300 text-xs">System</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs">{log.school?.name ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{log.entity ?? "—"}</td>
                      <td className="px-6 py-4 text-gray-400 text-xs font-mono">{log.ip ?? "—"}</td>
                      <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-PK", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-gray-400 text-xs">Page {page} of {totalPages} · {total.toLocaleString()} logs</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
