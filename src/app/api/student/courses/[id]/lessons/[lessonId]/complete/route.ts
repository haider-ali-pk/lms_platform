export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string; lessonId: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, lessonId } = await context.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: user.id, course_id: id } },
    });
    if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 403 });

    await prisma.lessonProgress.upsert({
      where: { student_id_lesson_id: { student_id: user.id, lesson_id: lessonId } },
      update: { is_completed: true, completed_at: new Date() },
      create: { student_id: user.id, lesson_id: lessonId, is_completed: true, completed_at: new Date() },
    });

    // Check if all lessons completed → mark course complete
    const totalLessons = await prisma.lesson.count({ where: { course_id: id, is_published: true } });
    const completedLessons = await prisma.lessonProgress.count({
      where: { student_id: user.id, lesson: { course_id: id }, is_completed: true },
    });

    if (totalLessons > 0 && completedLessons >= totalLessons) {
      await prisma.enrollment.update({
        where: { student_id_course_id: { student_id: user.id, course_id: id } },
        update: { completed_at: new Date() },
        data: { completed_at: new Date() },
      });
    }

    return NextResponse.json({ success: true, completedLessons, totalLessons });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}