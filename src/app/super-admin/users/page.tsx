// src/app/super-admin/users/page.tsx
"use client";
import React from "react";
import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, X, Check, AlertCircle,
  Search, Users, ShieldCheck, GraduationCap,
  BookOpen, UserCheck, ChevronLeft, ChevronRight,
} from "lucide-react";
import BackButton from "@/components/BackButton";

interface School { id: string; name: string; }

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  school: { id: string; name: string } | null;
}

const ROLES = ["super_admin", "admin", "teacher", "student", "parent"];

const ROLE_STYLES: Record<string, string> = {
  super_admin: "bg-red-50 text-red-600 border border-red-200",
  admin: "bg-indigo-50 text-indigo-600 border border-indigo-200",
  teacher: "bg-blue-50 text-blue-600 border border-blue-200",
  student: "bg-green-50 text-green-600 border border-green-200",
  parent: "bg-amber-50 text-amber-600 border border-amber-200",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  super_admin: <ShieldCheck size={14} />,
  admin: <UserCheck size={14} />,
  teacher: <BookOpen size={14} />,
  student: <GraduationCap size={14} />,
  parent: <Users size={14} />,
};

const EMPTY_FORM = { first_name: "", last_name: "", email: "", password: "", role: "student", school_id: "", is_active: true };

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  async function fetchUsers(p = page) {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(p),
      limit: "20",
      ...(search && { search }),
      ...(roleFilter && { role: roleFilter }),
      ...(schoolFilter && { school_id: schoolFilter }),
    });
    const res = await fetch(`/api/super-admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.error) { setError(data.error); setLoading(false); return; }
    setUsers(data.users);
    setTotal(data.total);
    setTotalPages(data.pages);
    setLoading(false);
  }

  async function fetchSchools() {
    const res = await fetch("/api/super-admin/schools", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.error) setSchools(data.schools);
  }

  useEffect(() => { fetchSchools(); }, []);
  useEffect(() => { fetchUsers(page); }, [page, roleFilter, schoolFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchUsers(1);
  }

  function openCreate() {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(u: User) {
    setEditUser(u);
    setForm({
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      password: "",
      role: u.role,
      school_id: u.school?.id ?? "",
      is_active: u.is_active,
    });
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setFormError("");
    const url = editUser ? `/api/super-admin/users/${editUser.id}` : "/api/super-admin/users";
    const method = editUser ? "PUT" : "POST";
    const body = { ...form };
    if (editUser && !body.password) delete (body as any).password;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) { setFormError(data.error); setSubmitting(false); return; }
    setShowModal(false);
    fetchUsers(page);
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/super-admin/users/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleteId(null);
    setDeleting(false);
    fetchUsers(page);
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      <BackButton href="/super-admin/dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total users across all schools</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 shadow-sm"
          />
        </form>

        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 shadow-sm"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
        </select>

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
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle size={18} /> {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3">User</th>
                  <th className="text-left px-6 py-3">Role</th>
                  <th className="text-left px-6 py-3">School</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Joined</th>
                  <th className="text-left px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-400">No users found.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                            {u.first_name.charAt(0)}{u.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">{u.first_name} {u.last_name}</p>
                            <p className="text-gray-400 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium capitalize ${ROLE_STYLES[u.role]}`}>
                          {ROLE_ICONS[u.role]} {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{u.school?.name ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.is_active ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-500 border border-red-200"}`}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
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
              <p className="text-gray-400 text-xs">Page {page} of {totalPages} · {total.toLocaleString()} users</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 font-semibold text-lg">{editUser ? "Edit User" : "Add New User"}</h2>
                <p className="text-gray-400 text-xs mt-0.5">{editUser ? "Update user details" : "Fill in the details below"}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <X size={15} />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
                <AlertCircle size={14} /> {formError}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "First Name *", key: "first_name", placeholder: "Haider" },
                  { label: "Last Name *", key: "last_name", placeholder: "Ali" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">{f.label}</label>
                    <input
                      value={form[f.key as keyof typeof form] as string}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                  </div>
                ))}
              </div>

              {[
                { label: "Email *", key: "email", placeholder: "user@school.edu.pk", type: "email" },
                { label: editUser ? "New Password (leave blank to keep)" : "Password *", key: "password", placeholder: "••••••••", type: "password" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                </div>
              ))}

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 transition-colors"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">School</label>
                <select
                  value={form.school_id}
                  onChange={(e) => setForm({ ...form, school_id: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 transition-colors"
                >
                  <option value="">No School (Super Admin)</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {editUser && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">Active account</label>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Check size={14} /> {editUser ? "Save Changes" : "Create User"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-gray-900 font-semibold">Delete User?</h2>
                <p className="text-gray-400 text-xs mt-0.5">This user will be soft deleted and deactivated.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 text-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}