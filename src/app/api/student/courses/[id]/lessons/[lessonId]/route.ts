export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string; lessonId: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, lessonId } = await context.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: user.id, course_id: id } },
    });
    if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 403 });

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { progress: { where: { student_id: user.id } } },
    });
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    return NextResponse.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content,
        video_url: lesson.video_url,
        pdf_url: lesson.pdf_url,
        duration_min: lesson.duration_min,
        is_completed: lesson.progress[0]?.is_completed || false,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}