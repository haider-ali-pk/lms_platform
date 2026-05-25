export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const { answers, time_taken } = await req.json();

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    const attemptsCount = await prisma.quizAttempt.count({
      where: { quiz_id: id, student_id: user.id },
    });
    if (attemptsCount >= quiz.max_attempts) {
      return NextResponse.json({ error: "Max attempts reached" }, { status: 400 });
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const results: any[] = [];

    quiz.questions.forEach((q, idx) => {
      totalPoints += q.points;
      const studentAnswer = answers[idx];
      const isCorrect = studentAnswer === q.correct_index;
      if (isCorrect) earnedPoints += q.points;
      results.push({
        question: q.question_text,
        options: q.options,
        student_answer: studentAnswer,
        correct_answer: q.correct_index,
        explanation: q.explanation,
        is_correct: isCorrect,
        points: q.points,
      });
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.pass_mark;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quiz_id: id,
        student_id: user.id,
        answers,
        score,
        passed,
        time_taken,
      },
    });

    return NextResponse.json({ attempt, score, passed, results, earnedPoints, totalPoints });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}