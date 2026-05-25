export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: { select: { title: true } },
        questions: { orderBy: { order: "asc" } },
        attempts: { where: { student_id: user.id }, orderBy: { submitted_at: "desc" } },
      },
    });

    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        time_limit: quiz.time_limit,
        pass_mark: quiz.pass_mark,
        max_attempts: quiz.max_attempts,
        course_title: quiz.course.title,
        attempts_used: quiz.attempts.length,
        can_attempt: quiz.attempts.length < quiz.max_attempts,
        questions: quiz.questions.map(q => ({
          id: q.id,
          question_text: q.question_text,
          options: q.options,
          points: q.points,
          order: q.order,
        })),
        past_attempts: quiz.attempts.map(a => ({
          id: a.id,
          score: a.score,
          passed: a.passed,
          time_taken: a.time_taken,
          submitted_at: a.submitted_at,
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}