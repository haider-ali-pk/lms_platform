export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  const quiz = await prisma.quiz.findFirst({
    where: { id, course: { author_id: user.id } },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, question_text: true, options: true, correct_index: true },
      },
      _count: { select: { attempts: true } },
    },
  });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attempts = await prisma.quizAttempt.findMany({
    where: { quiz_id: id },
    include: {
      student: { select: { id: true, first_name: true, last_name: true, email: true, avatar_url: true } },
    },
    orderBy: { submitted_at: "desc" },
  });

  const totalQ = quiz.questions.length;
  const avg = attempts.length > 0 && totalQ > 0
    ? attempts.reduce((s: number, a) => s + (a.score / totalQ) * 100, 0) / attempts.length
    : null;
  const passRate = attempts.length > 0
    ? (attempts.filter((a) => a.passed).length / attempts.length) * 100
    : null;

  const submissions = attempts.map((a, i) => ({
    id: a.id,
    score: a.score,
    passed: a.passed,
    time_taken: a.time_taken,
    submitted_at: a.submitted_at,
    attempt_number: i + 1,
    student: a.student,
    answers: Array.isArray(a.answers) ? a.answers : Object.values(a.answers as Record<string, number>),
  }));

  return NextResponse.json({
    quiz: { ...quiz, avg_score: avg, pass_rate: passRate },
    submissions,
  });
}