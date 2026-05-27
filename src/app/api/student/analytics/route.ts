export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all student data
  const [quizAttempts, lessonProgress, assignments, enrollments, sub] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { student_id: user.id },
      include: { quiz: { include: { course: { select: { title: true, subject: true } } } } },
      orderBy: { submitted_at: "desc" },
      take: 50,
    }),
    prisma.lessonProgress.findMany({
      where: { student_id: user.id },
      include: { lesson: { include: { course: { select: { title: true, subject: true } } } } },
    }),
    prisma.assignmentSubmission.findMany({
      where: { student_id: user.id },
      include: { assignment: { include: { course: { select: { title: true } } } } },
      orderBy: { submitted_at: "desc" },
      take: 20,
    }),
    prisma.enrollment.findMany({
      where: { student_id: user.id },
      include: { course: { select: { title: true, subject: true } } },
    }),
    prisma.studentSubscription.findUnique({ where: { student_id: user.id } }),
  ]);

  // Build analytics summary
  const totalLessons = lessonProgress.length;
  const completedLessons = lessonProgress.filter(p => p.is_completed).length;
  const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const avgQuizScore = quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length)
    : 0;

  const passedQuizzes = quizAttempts.filter(a => a.passed).length;
  const failedQuizzes = quizAttempts.filter(a => !a.passed).length;

  // Per-subject performance
  const subjectMap: Record<string, { scores: number[]; subject: string }> = {};
  for (const attempt of quizAttempts) {
    const subject = attempt.quiz.course.subject ?? attempt.quiz.course.title;
    if (!subjectMap[subject]) subjectMap[subject] = { scores: [], subject };
    subjectMap[subject].scores.push(attempt.score);
  }

  const subjectPerformance = Object.entries(subjectMap).map(([subject, data]) => ({
    subject,
    avgScore: Math.round(data.scores.reduce((s, n) => s + n, 0) / data.scores.length),
    attempts: data.scores.length,
  })).sort((a, b) => a.avgScore - b.avgScore);

  const weakSubjects = subjectPerformance.filter(s => s.avgScore < 60);
  const strongSubjects = subjectPerformance.filter(s => s.avgScore >= 80);

  // Build AI prompt
  const dataContext = `
Student Performance Summary:
- Enrolled in ${enrollments.length} courses
- Lesson completion rate: ${completionRate}% (${completedLessons}/${totalLessons} lessons)
- Average quiz score: ${avgQuizScore}%
- Passed ${passedQuizzes} quizzes, failed ${failedQuizzes} quizzes
- Subject performance: ${subjectPerformance.map(s => `${s.subject}: ${s.avgScore}% avg (${s.attempts} attempts)`).join(", ")}
- Weak subjects (below 60%): ${weakSubjects.map(s => s.subject).join(", ") || "none"}
- Strong subjects (above 80%): ${strongSubjects.map(s => s.subject).join(", ") || "none"}
- Recent quiz scores: ${quizAttempts.slice(0, 5).map(a => `${a.quiz.course.title}: ${a.score}%`).join(", ")}
- Pending assignments: ${assignments.filter(a => a.status === "missing").length}
`;

  const prompt = `You are an expert AI learning coach. Based on this student's performance data, provide a personalized analysis and study plan.

${dataContext}

Provide a response in this EXACT JSON format (no markdown, just raw JSON):
{
  "overallAssessment": "2-3 sentence overall assessment of the student's performance",
  "strengthAreas": ["strength 1", "strength 2", "strength 3"],
  "weakAreas": ["weak area 1", "weak area 2"],
  "studyPlan": [
    {
      "priority": "high",
      "subject": "subject name",
      "action": "specific action to take",
      "timeframe": "this week"
    }
  ],
  "motivationalMessage": "1 encouraging sentence personalized to their situation",
  "weeklyGoal": "one specific measurable goal for this week",
  "predictedImprovement": "what improvement they can expect if they follow the plan"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const aiAnalysis = JSON.parse(clean);

    return NextResponse.json({
      analytics: {
        totalLessons,
        completedLessons,
        completionRate,
        avgQuizScore,
        passedQuizzes,
        failedQuizzes,
        totalCourses: enrollments.length,
        subjectPerformance,
        weakSubjects,
        strongSubjects,
      },
      aiAnalysis,
      plan: sub?.plan ?? "free",
    });
  } catch (err) {
    return NextResponse.json({
      analytics: {
        totalLessons,
        completedLessons,
        completionRate,
        avgQuizScore,
        passedQuizzes,
        failedQuizzes,
        totalCourses: enrollments.length,
        subjectPerformance,
        weakSubjects,
        strongSubjects,
      },
      aiAnalysis: null,
      plan: sub?.plan ?? "free",
    });
  }
}