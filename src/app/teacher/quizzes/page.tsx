"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Filter, BookOpen, Clock, Users,
  BarChart2, Edit2, Trash2, Eye, CheckCircle, XCircle
} from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit: number | null;
  pass_mark: number;
  max_attempts: number;
  is_published: boolean;
  created_at: string;
  course: { id: string; title: string; subject: string | null };
  _count: { questions: number; attempts: number };
  avg_score: number | null;
}

interface Course {
  id: string;
  title: string;
  subject: string | null;
}

export default function TeacherQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, published: 0, attempts: 0, avgScore: 0 });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
  setLoading(true);
  try {
    const [qRes, cRes] = await Promise.all([
      fetch("/api/teacher/quizzes"),
      fetch("/api/teacher/courses-list"),
    ]);
    const qData = await qRes.json();
    const cData = await cRes.json();
    setQuizzes(qData.quizzes || []);
    setCourses(cData.courses || []);
    setStats(qData.stats || { total: 0, published: 0, attempts: 0, avgScore: 0 });
  } catch (err) {
    console.error("Failed to fetch quizzes:", err);
  } finally {
    setLoading(false);  // ← this was missing — always runs even on error
  }
}

  async function handleDelete(id: string) {
    await fetch(`/api/teacher/quizzes/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchData();
  }

  async function togglePublish(quiz: Quiz) {
    await fetch(`/api/teacher/quizzes/${quiz.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !quiz.is_published }),
    });
    fetchData();
  }

  const filtered = quizzes.filter((q) => {
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase());
    const matchCourse = filterCourse === "all" || q.course.id === filterCourse;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && q.is_published) ||
      (filterStatus === "draft" && !q.is_published);
    return matchSearch && matchCourse && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push("/teacher/dashboard")}
              className="text-sm text-gray-500 hover:text-indigo-600 mb-1 flex items-center gap-1 transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
            <p className="text-gray-500 mt-1">Create, manage, and track quiz performance</p>
          </div>
          <button
            onClick={() => router.push("/teacher/quizzes/create")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={18} /> Create Quiz
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Quizzes", value: stats.total, icon: BookOpen, color: "indigo", bg: "bg-indigo-50", text: "text-indigo-600", border: "border-l-indigo-500" },
            { label: "Published", value: stats.published, icon: CheckCircle, color: "emerald", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-l-emerald-500" },
            { label: "Total Attempts", value: stats.attempts, icon: Users, color: "amber", bg: "bg-amber-50", text: "text-amber-600", border: "border-l-amber-500" },
            { label: "Avg Score", value: stats.avgScore ? `${stats.avgScore}%` : "—", icon: BarChart2, color: "violet", bg: "bg-violet-50", text: "text-violet-600", border: "border-l-violet-500" },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 ${s.border} hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500 font-medium">{s.label}</span>
                <div className={`${s.bg} p-2 rounded-lg`}>
                  <s.icon size={18} className={s.text} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quizzes..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Quiz Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-6" />
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-12 bg-gray-100 rounded-xl" />)}
                </div>
                <div className="h-8 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No quizzes found</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first quiz to start assessing students</p>
            <button
              onClick={() => router.push("/teacher/quizzes/create")}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((quiz) => (
              <div key={quiz.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden group">
                {/* Card top accent */}
                <div className={`h-1 ${quiz.is_published ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-gray-300 to-gray-400"}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold text-gray-900 text-base truncate">{quiz.title}</h3>
                      <p className="text-xs text-indigo-600 font-medium mt-0.5 truncate">{quiz.course.title}</p>
                    </div>
                    <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${quiz.is_published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {quiz.is_published ? "Published" : "Draft"}
                    </span>
                  </div>

                  {quiz.description && (
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{quiz.description}</p>
                  )}

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-indigo-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-bold text-indigo-700">{quiz._count.questions}</p>
                      <p className="text-xs text-indigo-500">Questions</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-bold text-amber-700">{quiz.time_limit ?? "∞"}</p>
                      <p className="text-xs text-amber-500">Minutes</p>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-bold text-violet-700">{quiz._count.attempts}</p>
                      <p className="text-xs text-violet-500">Attempts</p>
                    </div>
                  </div>

                  {/* Pass mark + avg */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>Pass mark: <strong className="text-gray-700">{quiz.pass_mark}%</strong></span>
                    <span>Avg score: <strong className={quiz.avg_score !== null ? (quiz.avg_score >= quiz.pass_mark ? "text-emerald-600" : "text-red-500") : "text-gray-400"}>
                      {quiz.avg_score !== null ? `${Math.round(quiz.avg_score)}%` : "—"}
                    </strong></span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/teacher/quizzes/${quiz.id}/submissions`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-xl text-xs font-medium transition-colors border border-gray-100"
                    >
                      <Eye size={14} /> Submissions
                    </button>
                    <button
                      onClick={() => router.push(`/teacher/quizzes/${quiz.id}/edit`)}
                      className="flex items-center justify-center p-2 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-xl transition-colors border border-gray-100"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => togglePublish(quiz)}
                      className={`flex items-center justify-center p-2 rounded-xl transition-colors border ${quiz.is_published ? "bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-100" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-100"}`}
                      title={quiz.is_published ? "Unpublish" : "Publish"}
                    >
                      {quiz.is_published ? <XCircle size={14} /> : <CheckCircle size={14} />}
                    </button>
                    <button
                      onClick={() => setDeleteId(quiz.id)}
                      className="flex items-center justify-center p-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-500 rounded-xl transition-colors border border-gray-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Quiz</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This will permanently delete the quiz and all student attempts. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
