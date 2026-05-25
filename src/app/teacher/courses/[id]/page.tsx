"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

interface Course {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  grade_level: string | null;
  is_published: boolean;
  _count: { lessons: number; enrollments: number; assignments: number };
}

interface Lesson {
  id: string;
  title: string;
  type: string;
  order: number;
  duration_min: number | null;
  is_published: boolean;
  content: string | null;
  video_url: string | null;
  pdf_url: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_marks: number;
  is_published: boolean;
  _count: { submissions: number };
}

const LESSON_TYPES = ["video", "text", "pdf", "quiz"];
const TYPE_ICONS: Record<string, string> = {
  video: "🎥", text: "📝", pdf: "📄", quiz: "❓",
};

function LessonModal({ lesson, courseId, onClose, onSave }: {
  lesson: Lesson | null; courseId: string;
  onClose: () => void; onSave: () => void;
}) {
  const isEdit = !!lesson;
  const [form, setForm] = useState({
    title: lesson?.title || "",
    type: lesson?.type || "video",
    content: lesson?.content || "",
    video_url: lesson?.video_url || "",
    pdf_url: lesson?.pdf_url || "",
    duration_min: lesson?.duration_min?.toString() || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title required"); return; }
    setLoading(true);
    const res = await fetch(
      isEdit
        ? `/api/teacher/courses/${courseId}/lessons/${lesson!.id}`
        : `/api/teacher/courses/${courseId}/lessons`,
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setLoading(false); return; }
    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? "Edit Lesson" : "Add Lesson"}</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Lesson title" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {LESSON_TYPES.map((t) => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (min)</label>
              <input name="duration_min" value={form.duration_min} onChange={handleChange} type="number" placeholder="e.g. 30" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {form.type === "video" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Video URL</label>
              <input name="video_url" value={form.video_url} onChange={handleChange} placeholder="https://youtube.com/..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}
          {form.type === "pdf" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">PDF URL</label>
              <input name="pdf_url" value={form.pdf_url} onChange={handleChange} placeholder="https://..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}
          {(form.type === "text" || form.type === "quiz") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
              <textarea name="content" value={form.content} onChange={handleChange} rows={5} placeholder="Write lesson content..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Lesson"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-gray-400 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function AssignmentModal({ courseId, onClose, onSave }: {
  courseId: string; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({ title: "", description: "", due_date: "", max_marks: "100" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.due_date) { setError("All fields required"); return; }
    setLoading(true);
    const res = await fetch(`/api/teacher/courses/${courseId}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setLoading(false); return; }
    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Add Assignment</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Assignment title" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="What should students do?" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date <span className="text-red-500">*</span></label>
              <input name="due_date" value={form.due_date} onChange={handleChange} type="datetime-local" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Marks</label>
              <input name="max_marks" value={form.max_marks} onChange={handleChange} type="number" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? "Saving…" : "Add Assignment"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-gray-400 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tab, setTab] = useState<"lessons" | "assignments">("lessons");
  const [loading, setLoading] = useState(true);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [deleteLesson, setDeleteLesson] = useState("");

  const fetchCourse = useCallback(async () => {
    const res = await fetch(`/api/teacher/courses`);
    const data = await res.json();
    const found = (data.courses || []).find((c: Course) => c.id === courseId);
    setCourse(found || null);
  }, [courseId]);

  const fetchLessons = useCallback(async () => {
    const res = await fetch(`/api/teacher/courses/${courseId}/lessons`);
    const data = await res.json();
    setLessons(data.lessons || []);
  }, [courseId]);

  const fetchAssignments = useCallback(async () => {
    const res = await fetch(`/api/teacher/courses/${courseId}/assignments`);
    const data = await res.json();
    setAssignments(data.assignments || []);
  }, [courseId]);

  useEffect(() => {
    Promise.all([fetchCourse(), fetchLessons(), fetchAssignments()]).finally(() => setLoading(false));
  }, [fetchCourse, fetchLessons, fetchAssignments]);

  const handleDeleteLesson = async (id: string) => {
    await fetch(`/api/teacher/courses/${courseId}/lessons/${id}`, { method: "DELETE" });
    setDeleteLesson("");
    fetchLessons();
  };

  const handleToggleLesson = async (lesson: Lesson) => {
    await fetch(`/api/teacher/courses/${courseId}/lessons/${lesson.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !lesson.is_published }),
    });
    fetchLessons();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Course not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${course.is_published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {course.is_published ? "Published" : "Draft"}
            </span>
          </div>
          <div className="flex gap-3 mt-1 text-sm text-gray-500">
            {course.subject && <span>{course.subject}</span>}
            {course.grade_level && <span>· {course.grade_level}</span>}
            <span>· {course._count.enrollments} students</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Lessons", value: lessons.length, icon: "🎥" },
          { label: "Assignments", value: assignments.length, icon: "📝" },
          { label: "Students", value: course._count.enrollments, icon: "👥" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit mb-6">
        {(["lessons", "assignments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={"px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors " + (tab === t ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-indigo-600")}
          >
            {t === "lessons" ? `📚 Lessons (${lessons.length})` : `📝 Assignments (${assignments.length})`}
          </button>
        ))}
      </div>

      {/* Lessons Tab */}
      {tab === "lessons" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-700">All Lessons</h2>
            <button
              onClick={() => { setEditLesson(null); setShowLessonModal(true); }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Lesson
            </button>
          </div>

          {lessons.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-400 text-sm mb-4">No lessons yet</p>
              <button onClick={() => { setEditLesson(null); setShowLessonModal(true); }} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">Add First Lesson</button>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, idx) => (
                <div key={lesson.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4">
                  <span className="text-gray-400 text-sm font-mono w-6">{idx + 1}</span>
                  <span className="text-xl">{TYPE_ICONS[lesson.type]}</span>
                  <div className="flex-1">
                    <p
  className="font-medium text-gray-800 text-sm cursor-pointer hover:text-indigo-600 transition-colors"
  onClick={() => router.push(`/teacher/courses/${courseId}/lessons/${lesson.id}`)}
>
  {lesson.title}
</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {lesson.type}{lesson.duration_min ? ` · ${lesson.duration_min} min` : ""}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lesson.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {lesson.is_published ? "Published" : "Draft"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleLesson(lesson)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${lesson.is_published ? "border-amber-200 text-amber-600 hover:bg-amber-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}
                    >
                      {lesson.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => { setEditLesson(lesson); setShowLessonModal(true); }}
                      className="px-3 py-1 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteLesson(lesson.id)}
                      className="px-3 py-1 rounded-lg text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {tab === "assignments" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-700">All Assignments</h2>
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Assignment
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-400 text-sm mb-4">No assignments yet</p>
              <button onClick={() => setShowAssignmentModal(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">Add First Assignment</button>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4">
                  <span className="text-xl">📝</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Due: {new Date(a.due_date).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                      {" · "}{a.max_marks} marks · {a._count.submissions} submissions
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {a.is_published ? "Published" : "Draft"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showLessonModal && (
        <LessonModal
          lesson={editLesson}
          courseId={courseId}
          onClose={() => { setShowLessonModal(false); setEditLesson(null); }}
          onSave={() => { setShowLessonModal(false); setEditLesson(null); fetchLessons(); }}
        />
      )}

      {showAssignmentModal && (
        <AssignmentModal
          courseId={courseId}
          onClose={() => setShowAssignmentModal(false)}
          onSave={() => { setShowAssignmentModal(false); fetchAssignments(); }}
        />
      )}

      {deleteLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Lesson?</h3>
            <p className="text-sm text-gray-500 mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDeleteLesson(deleteLesson)} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700">Delete</button>
              <button onClick={() => setDeleteLesson("")} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}