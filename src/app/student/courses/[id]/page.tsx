"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, BookOpen, Clock, CheckCircle, Circle, Play, FileText, Video, Award, Lock } from "lucide-react";
import StudentSidebar from "@/components/student/StudentSidebar";

interface Lesson {
  id: string;
  title: string;
  type: string;
  duration_min: number | null;
  order: number;
  is_completed: boolean;
}

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
  lessons: Lesson[];
}

const lessonIcon = (type: string) => {
  if (type === "video") return <Video size={14} className="text-indigo-500" />;
  if (type === "pdf") return <FileText size={14} className="text-amber-500" />;
  return <BookOpen size={14} className="text-emerald-500" />;
};

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/student/courses/${id}`).then(r => r.json()).then(d => {
      setCourse(d.course);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="flex h-screen bg-gray-50">
      <StudentSidebar active="courses" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!course) return null;

  const firstIncomplete = course.lessons.find(l => !l.is_completed);
  const continueLesson = firstIncomplete || course.lessons[0];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar active="courses" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          {/* Back */}
          <button onClick={() => router.push("/student/courses")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
            <ChevronLeft size={16} /> Back to Courses
          </button>

          {/* Course header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="h-48 bg-gradient-to-br from-indigo-500 to-violet-600 relative">
              {course.thumbnail_url && <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />}
              {course.completed_at && (
                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Award size={14} /> Course Completed
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {course.subject && <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">{course.subject}</span>}
                    {course.grade_level && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{course.grade_level}</span>}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{course.title}</h1>
                  <p className="text-sm text-gray-500 mb-3">By {course.author}</p>
                  {course.description && <p className="text-gray-600 text-sm leading-relaxed">{course.description}</p>}
                </div>
                {continueLesson && (
                  <button
                    onClick={() => router.push(`/student/courses/${id}/lessons/${continueLesson.id}`)}
                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm"
                  >
                    <Play size={16} />
                    {course.completedLessons === 0 ? "Start Course" : course.completed_at ? "Review" : "Continue"}
                  </button>
                )}
              </div>

              {/* Progress */}
              <div className="mt-5 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Course Progress</span>
                  <span className={`text-sm font-bold ${course.progress === 100 ? "text-emerald-600" : "text-indigo-600"}`}>{course.progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${course.progress === 100 ? "bg-emerald-500" : "bg-indigo-500"}`} style={{ width: `${course.progress}%` }} />
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> {course.completedLessons} completed</span>
                  <span className="flex items-center gap-1"><Circle size={12} /> {course.totalLessons - course.completedLessons} remaining</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> Enrolled {new Date(course.enrolled_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lessons list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Course Lessons ({course.totalLessons})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {course.lessons.map((lesson, idx) => (
                <div
                  key={lesson.id}
                  onClick={() => router.push(`/student/courses/${id}/lessons/${lesson.id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${lesson.is_completed ? "bg-emerald-100" : "bg-gray-100"}`}>
                    {lesson.is_completed ? <CheckCircle size={16} className="text-emerald-500" /> : <span className="text-xs font-medium text-gray-500">{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${lesson.is_completed ? "text-gray-500" : "text-gray-900"} group-hover:text-indigo-600 transition-colors`}>{lesson.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {lessonIcon(lesson.type)}
                      <span className="text-xs text-gray-400 capitalize">{lesson.type}</span>
                      {lesson.duration_min && <span className="text-xs text-gray-400">· {lesson.duration_min} min</span>}
                    </div>
                  </div>
                  {lesson.is_completed && <span className="text-xs text-emerald-600 font-medium shrink-0">Done</span>}
                  <Play size={14} className="text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}