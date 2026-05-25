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

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const quiz = await prisma.quiz.findFirst({
    where: { id, course: { author_id: user.id } },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ quiz });
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const { title, description, course_id, time_limit, pass_mark, max_attempts, is_published, questions } = await req.json();

  await prisma.$transaction([
    prisma.quizQuestion.deleteMany({ where: { quiz_id: id } }),
    prisma.quiz.update({
      where: { id },
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
    }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();
  await prisma.quiz.update({ where: { id }, data: body });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  await prisma.quiz.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}