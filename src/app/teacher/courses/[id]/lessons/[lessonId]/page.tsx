"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

interface Lesson {
  id: string;
  title: string;
  type: string;
  content: string | null;
  video_url: string | null;
  pdf_url: string | null;
  duration_min: number | null;
  is_published: boolean;
  order: number;
}

interface Course {
  id: string;
  title: string;
}

function getYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

function VideoPlayer({ url }: { url: string }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-xl"
          src={`https://www.youtube.com/embed/${ytId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <video
      src={url}
      controls
      className="w-full rounded-xl max-h-[500px] bg-black"
    />
  );
}

function PdfViewer({ url }: { url: string }) {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: "600px" }}>
      <iframe src={url} className="w-full h-full" title="PDF Viewer" />
    </div>
  );
}

function TextContent({ content }: { content: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
      {content}
    </div>
  );
}

export default function LessonViewerPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [lessonsRes, coursesRes] = await Promise.all([
      fetch(`/api/teacher/courses/${courseId}/lessons`),
      fetch(`/api/teacher/courses`),
    ]);
    const lessonsData = await lessonsRes.json();
    const coursesData = await coursesRes.json();

    const all: Lesson[] = lessonsData.lessons || [];
    const found = all.find((l) => l.id === lessonId) || null;
    const foundCourse = (coursesData.courses || []).find((c: Course) => c.id === courseId) || null;

    setAllLessons(all);
    setLesson(found);
    setCourse(foundCourse);
    setLoading(false);
  }, [courseId, lessonId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Lesson not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Banner */}
      <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium">
        👁️ Teacher Preview Mode — Students will see this content when published
      </div>

      <div className="flex h-[calc(100vh-36px)]">
        {/* Sidebar — lesson list */}
        <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-4 py-4 border-b border-gray-100">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 mb-3 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Course
            </button>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Course</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5 line-clamp-2">{course?.title}</p>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {allLessons.map((l, idx) => (
              <button
                key={l.id}
                onClick={() => router.push(`/teacher/courses/${courseId}/lessons/${l.id}`)}
                className={
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors " +
                  (l.id === lessonId
                    ? "bg-indigo-50 border-l-4 border-indigo-600"
                    : "hover:bg-gray-50 border-l-4 border-transparent")
                }
              >
                <span className="text-xs text-gray-400 w-5 flex-shrink-0">{idx + 1}</span>
                <span className="text-base flex-shrink-0">
                  {l.type === "video" ? "🎥" : l.type === "pdf" ? "📄" : l.type === "quiz" ? "❓" : "📝"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${l.id === lessonId ? "text-indigo-700" : "text-gray-700"}`}>
                    {l.title}
                  </p>
                  {l.duration_min && (
                    <p className="text-xs text-gray-400 mt-0.5">{l.duration_min} min</p>
                  )}
                </div>
                {!l.is_published && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">Draft</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Lesson header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                  Lesson {currentIndex + 1} of {allLessons.length}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lesson.is_published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {lesson.is_published ? "Published" : "Draft"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <span className="capitalize">{lesson.type}</span>
                {lesson.duration_min && <span>· {lesson.duration_min} min</span>}
              </div>
            </div>

            {/* Content */}
            <div className="mb-8">
              {lesson.type === "video" && lesson.video_url ? (
                <VideoPlayer url={lesson.video_url} />
              ) : lesson.type === "video" && !lesson.video_url ? (
                <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p className="text-4xl mb-2">🎥</p>
                    <p className="text-sm">No video URL added yet</p>
                  </div>
                </div>
              ) : null}

              {lesson.type === "pdf" && lesson.pdf_url ? (
                <PdfViewer url={lesson.pdf_url} />
              ) : lesson.type === "pdf" && !lesson.pdf_url ? (
                <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p className="text-4xl mb-2">📄</p>
                    <p className="text-sm">No PDF URL added yet</p>
                  </div>
                </div>
              ) : null}

              {(lesson.type === "text" || lesson.type === "quiz") && lesson.content ? (
                <TextContent content={lesson.content} />
              ) : (lesson.type === "text" || lesson.type === "quiz") && !lesson.content ? (
                <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p className="text-4xl mb-2">📝</p>
                    <p className="text-sm">No content added yet</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Prev / Next navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              {prevLesson ? (
                <button
                  onClick={() => router.push(`/teacher/courses/${courseId}/lessons/${prevLesson.id}`)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <div className="text-left">
                    <p className="text-xs text-gray-400">Previous</p>
                    <p className="font-medium">{prevLesson.title}</p>
                  </div>
                </button>
              ) : <div />}

              {nextLesson ? (
                <button
                  onClick={() => router.push(`/teacher/courses/${courseId}/lessons/${nextLesson.id}`)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Next</p>
                    <p className="font-medium">{nextLesson.title}</p>
                  </div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/teacher/courses/${courseId}`)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Back to Course
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}