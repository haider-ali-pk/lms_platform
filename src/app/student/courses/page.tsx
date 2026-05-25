"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock, ChevronRight, Search, Filter, Award, Play } from "lucide-react";
import StudentSidebar from "@/components/student/StudentSidebar";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  subject: string | null;
  grade_level: string | null;
  author: string;
  enrolled_at: string;
  completed_at: string | null;
  totalLessons: number;
  completedLessons: number;
  progress: number;
}

export default function StudentCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");

  useEffect(() => {
    fetch("/api/student/courses").then(r => r.json()).then(d => {
      setCourses(d.courses || []);
      setLoading(false);
    });
  }, []);

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.subject?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ? true : filter === "completed" ? !!c.completed_at : !c.completed_at;
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar active="courses" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-500 mt-1">Continue your learning journey</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Enrolled", value: courses.length, color: "indigo", icon: BookOpen },
              { label: "In Progress", value: courses.filter(c => !c.completed_at && c.progress > 0).length, color: "amber", icon: Play },
              { label: "Completed", value: courses.filter(c => !!c.completed_at).length, color: "emerald", icon: Award },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${s.color}-50`}>
                  <s.icon size={22} className={`text-${s.color}-600`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "in-progress", "completed"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === f ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {f === "all" ? "All" : f === "in-progress" ? "In Progress" : "Completed"}
                </button>
              ))}
            </div>
          </div>

          {/* Courses grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-2 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No courses found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(course => (
                <div
                  key={course.id}
                  onClick={() => router.push(`/student/courses/${course.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="h-40 bg-gradient-to-br from-indigo-500 to-violet-600 relative overflow-hidden">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={40} className="text-white/60" />
                      </div>
                    )}
                    {course.completed_at && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Award size={11} /> Completed
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                        <Play size={20} className="text-indigo-600 ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{course.title}</h3>
                      <ChevronRight size={16} className="text-gray-400 shrink-0 mt-0.5 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                      {course.subject && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{course.subject}</span>}
                      {course.grade_level && <span>{course.grade_level}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">By {course.author}</p>

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">{course.completedLessons}/{course.totalLessons} lessons</span>
                        <span className={`font-semibold ${course.progress === 100 ? "text-emerald-600" : "text-indigo-600"}`}>{course.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${course.progress === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                      <Clock size={11} />
                      <span>Enrolled {new Date(course.enrolled_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}