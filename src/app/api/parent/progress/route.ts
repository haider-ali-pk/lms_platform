export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "parent") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const childId = req.nextUrl.searchParams.get("child_id");
    if (!childId) return NextResponse.json({ error: "child_id required" }, { status: 400 });

    // Verify this child belongs to the parent
    const link = await prisma.parentStudent.findUnique({
      where: { parent_id_student_id: { parent_id: user.id, student_id: childId } },
    });
    if (!link) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const student = await prisma.user.findUnique({
      where: { id: childId },
      select: {
        id: true, first_name: true, last_name: true,
        school: { select: { name: true } },
        enrollments: {
          select: {
            completed_at: true,
            course: {
              select: {
                id: true, title: true, subject: true,
                lessons: { select: { id: true } },
              },
            },
          },
        },
        lesson_progress: { select: { lesson_id: true, is_completed: true } },
        quiz_attempts: {
          select: { score: true, passed: true, created_at: true, quiz: { select: { course_id: true } } },
        },
      },
    });

    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const completedLessonIds = new Set(student.lesson_progress.filter(lp => lp.is_completed).map(lp => lp.lesson_id));

    const courses = student.enrollments.map(e => {
      const lessonIds = e.course.lessons.map(l => l.id);
      const lessonsCompleted = lessonIds.filter(id => completedLessonIds.has(id)).length;
      const quizAttempts = student.quiz_attempts
        .filter(a => a.quiz.course_id === e.course.id)
        .map(a => ({ score: a.score, passed: a.passed, created_at: new Date(a.created_at).toISOString() }));
      return {
        id: e.course.id,
        title: e.course.title,
        subject: e.course.subject ?? "",
        lessons_total: lessonIds.length,
        lessons_completed: lessonsCompleted,
        completed_at: e.completed_at?.toISOString() ?? null,
        quiz_attempts: quizAttempts,
      };
    });

    return NextResponse.json({
      progress: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        school_name: student.school?.name ?? "—",
        courses,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}