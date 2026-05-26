// src/app/super-admin/schools/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, AlertCircle, Search, School, Users, BookOpen, Wifi, WifiOff } from "lucide-react";
import BackButton from "@/components/BackButton";

interface School {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  slug: string;
  is_active: boolean;
  created_at: string;
  _count: { users: number; courses: number };
  stripe_subscription: { plan: string; status: string } | null;
}

const EMPTY_FORM = { name: "", email: "", phone: "", address: "", city: "", slug: "" };

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-blue-50 text-blue-600 border border-blue-200",
  growth: "bg-purple-50 text-purple-600 border border-purple-200",
  enterprise: "bg-amber-50 text-amber-600 border border-amber-200",
};

export default function ManageSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [filtered, setFiltered] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editSchool, setEditSchool] = useState<School | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  async function fetchSchools() {
    setLoading(true);
    const res = await fetch("/api/super-admin/schools", {
    });
    const data = await res.json();
    if (data.error) { setError(data.error); setLoading(false); return; }
    setSchools(data.schools);
    setFiltered(data.schools);
    setLoading(false);
  }

  useEffect(() => { fetchSchools(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      schools.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      )
    );
  }, [search, schools]);

  function openCreate() {
    setEditSchool(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(school: School) {
    setEditSchool(school);
    setForm({
      name: school.name,
      email: school.email,
      phone: school.phone ?? "",
      address: school.address ?? "",
      city: school.city ?? "",
      slug: school.slug,
    });
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setFormError("");
    const url = editSchool ? `/api/super-admin/schools/${editSchool.id}` : "/api/super-admin/schools";
    const method = editSchool ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) { setFormError(data.error); setSubmitting(false); return; }
    setShowModal(false);
    fetchSchools();
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/super-admin/schools/${deleteId}`, {
      method: "DELETE",
    });
    setDeleteId(null);
    setDeleting(false);
    fetchSchools();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 text-red-500 p-6">
      <AlertCircle size={18} /> <span>{error}</span>
    </div>
  );

  const activeCount = schools.filter((s) => s.is_active).length;
  const totalUsers = schools.reduce((sum, s) => sum + s._count.users, 0);
  const totalCourses = schools.reduce((sum, s) => sum + s._count.courses, 0);

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">

      {/* Back Button */}
      <BackButton href="/super-admin/dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Schools</h1>
          <p className="text-gray-500 text-sm mt-1">Full control over all schools on the platform</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
        >
          <Plus size={16} /> Add School
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Schools", value: schools.length, icon: <School size={18} />, color: "text-indigo-600 bg-indigo-50" },
          { label: "Active", value: activeCount, icon: <Wifi size={18} />, color: "text-green-600 bg-green-50" },
          { label: "Total Users", value: totalUsers.toLocaleString(), icon: <Users size={18} />, color: "text-blue-600 bg-blue-50" },
          { label: "Total Courses", value: totalCourses, icon: <BookOpen size={18} />, color: "text-purple-600 bg-purple-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-gray-900 font-bold text-lg">{stat.value}</p>
              <p className="text-gray-500 text-xs">{stat.label}</p>
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
          placeholder="Search by name, city or email..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors shadow-sm"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <p className="text-gray-400 col-span-3 text-center py-16">No schools found.</p>
        ) : (
          filtered.map((school) => (
            <div
              key={school.id}
              className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 hover:border-indigo-300 hover:shadow-md transition-all group shadow-sm"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {school.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold text-sm leading-tight">{school.name}</p>
                    <p className="text-gray-400 text-xs">{school.city ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(school)}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteId(school.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <p className="text-gray-900 font-semibold text-sm">{school._count.users.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">Users</p>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <p className="text-gray-900 font-semibold text-sm">{school._count.courses}</p>
                  <p className="text-gray-400 text-xs">Courses</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${PLAN_COLORS[school.stripe_subscription?.plan ?? ""] ?? "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                  {school.stripe_subscription?.plan ?? "No plan"}
                </span>
                <span className={`flex items-center gap-1.5 text-xs font-medium ${school.is_active ? "text-green-600" : "text-red-500"}`}>
                  {school.is_active ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {school.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 font-semibold text-lg">{editSchool ? "Edit School" : "Add New School"}</h2>
                <p className="text-gray-400 text-xs mt-0.5">{editSchool ? "Update school information" : "Fill in the details below"}</p>
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
              {[
                { label: "School Name *", key: "name", placeholder: "Beacon House School" },
                { label: "Email *", key: "email", placeholder: "info@school.edu.pk" },
                { label: "Slug *", key: "slug", placeholder: "beacon-house" },
                { label: "Phone", key: "phone", placeholder: "+92 300 1234567" },
                { label: "City", key: "city", placeholder: "Lahore" },
                { label: "Address", key: "address", placeholder: "123 Main Street" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">{field.label}</label>
                  <input
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    disabled={editSchool !== null && field.key === "slug"}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 disabled:opacity-40 transition-colors"
                  />
                </div>
              ))}
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
                  <><Check size={14} /> {editSchool ? "Save Changes" : "Create School"}</>
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
                <h2 className="text-gray-900 font-semibold">Delete School?</h2>
                <p className="text-gray-400 text-xs mt-0.5">All associated data will be permanently removed.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
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