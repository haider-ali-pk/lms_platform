"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, CheckCircle, Circle, FileText, Video, BookOpen, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import StudentSidebar from "@/components/student/StudentSidebar";

interface Lesson {
  id: string;
  title: string;
  type: string;
  content: string | null;
  video_url: string | null;
  pdf_url: string | null;
  duration_min: number | null;
  is_completed: boolean;
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const lessonId = params.lessonId as string;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!id || !lessonId) return;
    fetch(`/api/student/courses/${id}/lessons/${lessonId}`).then(r => r.json()).then(d => {
      setLesson(d.lesson);
      setCompleted(d.lesson?.is_completed || false);
      setLoading(false);
    });
  }, [id, lessonId]);

  async function markComplete() {
    if (completing || completed) return;
    setCompleting(true);
    await fetch(`/api/student/courses/${id}/lessons/${lessonId}/complete`, { method: "POST" });
    setCompleted(true);
    setCompleting(false);
    if (lesson) setLesson({ ...lesson, is_completed: true });
  }

  if (loading) return (
    <div className="flex h-screen bg-gray-50">
      <StudentSidebar active="courses" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!lesson) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar active="courses" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          {/* Back */}
          <button onClick={() => router.push(`/student/courses/${id}`)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
            <ChevronLeft size={16} /> Back to Course
          </button>

          {/* Lesson header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {lesson.type === "video" && <span className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium"><Video size={11} /> Video</span>}
                  {lesson.type === "pdf" && <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-medium"><FileText size={11} /> PDF</span>}
                  {lesson.type === "text" && <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium"><BookOpen size={11} /> Reading</span>}
                  {lesson.duration_min && <span className="text-xs text-gray-400">{lesson.duration_min} min</span>}
                </div>
                <h1 className="text-xl font-bold text-gray-900">{lesson.title}</h1>
              </div>
              <button
                onClick={markComplete}
                disabled={completed || completing}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${completed ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"}`}
              >
                {completing ? <Loader2 size={16} className="animate-spin" /> : completed ? <CheckCircle size={16} /> : <Circle size={16} />}
                {completed ? "Completed" : completing ? "Saving..." : "Mark Complete"}
              </button>
            </div>
          </div>

          {/* Lesson content */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Video */}
            {lesson.type === "video" && lesson.video_url && (
              <div className="aspect-video bg-black">
                <video src={lesson.video_url} controls className="w-full h-full" onEnded={markComplete} />
              </div>
            )}

            {/* PDF */}
            {lesson.type === "pdf" && lesson.pdf_url && (
              <div className="h-[600px]">
                <iframe src={lesson.pdf_url} className="w-full h-full" title={lesson.title} />
              </div>
            )}

            {/* Text / Quiz content */}
            {(lesson.type === "text" || lesson.type === "quiz") && lesson.content && (
              <div className="p-8 prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900">
                <ReactMarkdown>{lesson.content}</ReactMarkdown>
              </div>
            )}

            {/* No content fallback */}
            {!lesson.video_url && !lesson.pdf_url && !lesson.content && (
              <div className="p-16 text-center">
                <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Content coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
