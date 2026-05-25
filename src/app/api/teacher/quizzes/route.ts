export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type QuestionInput = {
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  points: number;
  order: number;
};

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quizzes = await prisma.quiz.findMany({
    where: { course: { author_id: user.id } },
    include: {
      course: { select: { id: true, title: true, subject: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { created_at: "desc" },
  });

  const quizzesWithStats = await Promise.all(quizzes.map(async (q) => {
    const attempts = await prisma.quizAttempt.findMany({
      where: { quiz_id: q.id },
      select: { score: true },
    });
    const totalQ = q._count.questions;
    const avg = attempts.length > 0 && totalQ > 0
      ? Math.round(attempts.reduce((s: number, a: { score: number }) => s + (a.score / totalQ) * 100, 0) / attempts.length)
      : null;
    return { ...q, avg_score: avg };
  }));

  const published = quizzes.filter((q) => q.is_published).length;
  const totalAttempts = quizzes.reduce((s: number, q) => s + q._count.attempts, 0);
  const allAvgs = quizzesWithStats.filter((q) => q.avg_score !== null).map((q) => q.avg_score as number);
  const avgScore = allAvgs.length > 0 ? Math.round(allAvgs.reduce((a: number, b: number) => a + b, 0) / allAvgs.length) : 0;

  return NextResponse.json({
    quizzes: quizzesWithStats,
    stats: { total: quizzes.length, published, attempts: totalAttempts, avgScore },
  });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, course_id, time_limit, pass_mark, max_attempts, is_published, questions } = body;

  const quiz = await prisma.quiz.create({
    data: {
      title, description, course_id, time_limit, pass_mark, max_attempts, is_published,
      questions: {
        create: questions.map((q: QuestionInput) => ({
          question_text: q.question_text,
          options: q.options,
          correct_index: q.correct_index,
          explanation: q.explanation || null,
          points: q.points,
          order: q.order,
        })),
      },
    },
  });

  return NextResponse.json({ id: quiz.id });
}