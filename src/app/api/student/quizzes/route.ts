export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: user.id },
      select: { course_id: true },
    });
    const courseIds = enrollments.map(e => e.course_id);

    const quizzes = await prisma.quiz.findMany({
      where: { course_id: { in: courseIds }, is_published: true },
      include: {
        course: { select: { title: true, subject: true } },
        questions: { select: { id: true } },
        attempts: { where: { student_id: user.id }, orderBy: { submitted_at: "desc" } },
      },
      orderBy: { created_at: "desc" },
    });

    const result = quizzes.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      time_limit: q.time_limit,
      pass_mark: q.pass_mark,
      max_attempts: q.max_attempts,
      course_title: q.course.title,
      course_subject: q.course.subject,
      total_questions: q.questions.length,
      attempts_used: q.attempts.length,
      best_score: q.attempts.length > 0 ? Math.max(...q.attempts.map(a => a.score)) : null,
      last_attempt: q.attempts[0] || null,
      can_attempt: q.attempts.length < q.max_attempts,
    }));

    return NextResponse.json({ quizzes: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}