export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGroq(prompt: string, systemPrompt: string, maxTokens = 2048): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  return completion.choices[0].message.content ?? "";
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, ...body } = await req.json();

  // ── AI GRADER ──────────────────────────────────────────────────────────
  if (type === "grade") {
    const { submission, rubric, maxMarks, assignmentTitle } = body;
    if (!submission) return NextResponse.json({ error: "Submission required" }, { status: 400 });

    const system = `You are an expert academic grader. You grade student submissions fairly, providing constructive feedback. You always respond in valid JSON only.`;

    const prompt = `Grade this student submission for "${assignmentTitle || "Assignment"}".

Max marks: ${maxMarks || 100}
Rubric: ${rubric || "General quality, accuracy, and completeness"}

Student Submission:
${submission}

Respond in this EXACT JSON format:
{
  "score": <number between 0 and ${maxMarks || 100}>,
  "percentage": <number>,
  "grade": "<A/B/C/D/F>",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "detailedFeedback": "<2-3 paragraphs of detailed feedback>",
  "rubricBreakdown": [
    { "criterion": "criterion name", "score": <number>, "maxScore": <number>, "comment": "comment" }
  ]
}`;

    const raw = await callGroq(prompt, system);
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return NextResponse.json({ result });
  }

  // ── CONTENT GENERATOR ──────────────────────────────────────────────────
  if (type === "generate") {
    const { topic, gradeLevel, contentType, subject } = body;
    if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 });

    const system = `You are an expert curriculum designer and educator. You create engaging, accurate educational content. You always respond in valid JSON only.`;

    let prompt = "";

    if (contentType === "lesson") {
      prompt = `Create a detailed lesson plan for:
Topic: ${topic}
Subject: ${subject || "General"}
Grade Level: ${gradeLevel || "High School"}

Respond in this EXACT JSON format:
{
  "title": "lesson title",
  "objective": "learning objective",
  "duration": "45 minutes",
  "introduction": "engaging intro paragraph",
  "mainContent": [
    { "section": "section title", "content": "detailed content", "activity": "student activity" }
  ],
  "keyPoints": ["point 1", "point 2", "point 3"],
  "homework": "homework assignment description",
  "assessment": "how to assess understanding"
}`;
    } else if (contentType === "quiz") {
      prompt = `Create 10 quiz questions for:
Topic: ${topic}
Subject: ${subject || "General"}
Grade Level: ${gradeLevel || "High School"}

Respond in this EXACT JSON format:
{
  "title": "quiz title",
  "questions": [
    {
      "question": "question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correct": "A",
      "explanation": "why this is correct"
    }
  ]
}`;
    } else if (contentType === "assignment") {
      prompt = `Create an assignment for:
Topic: ${topic}
Subject: ${subject || "General"}
Grade Level: ${gradeLevel || "High School"}

Respond in this EXACT JSON format:
{
  "title": "assignment title",
  "description": "detailed assignment description",
  "objectives": ["objective 1", "objective 2"],
  "tasks": [
    { "task": "task description", "marks": <number>, "instructions": "detailed instructions" }
  ],
  "totalMarks": <number>,
  "rubric": "grading rubric description",
  "dueTimeframe": "suggested time to complete"
}`;
    }

    const raw = await callGroq(prompt, system, 2048);
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return NextResponse.json({ result, contentType });
  }

  // ── CLASS ANALYTICS ────────────────────────────────────────────────────
  if (type === "classAnalytics") {
    const { courseId } = body;

    const courses = await prisma.course.findMany({
      where: { author_id: user.id, school_id: user.school_id },
      select: { id: true, title: true, subject: true },
    });

    if (courses.length === 0) return NextResponse.json({ analytics: null, message: "No courses found" });

    const targetCourseId = courseId || courses[0].id;

    const [enrollments, quizAttempts, lessonProgress] = await Promise.all([
      prisma.enrollment.findMany({
        where: { course_id: targetCourseId },
        include: { student: { select: { id: true, first_name: true, last_name: true, grade: true } } },
      }),
      prisma.quizAttempt.findMany({
        where: { quiz: { course_id: targetCourseId } },
        include: { student: { select: { id: true, first_name: true, last_name: true } }, quiz: { select: { title: true } } },
      }),
      prisma.lessonProgress.findMany({
        where: { lesson: { course_id: targetCourseId } },
        include: { lesson: { select: { title: true } } },
      }),
    ]);

    const studentStats = enrollments.map(e => {
      const studentAttempts = quizAttempts.filter(a => a.student_id === e.student_id);
      const studentProgress = lessonProgress.filter(p => p.student_id === e.student_id);
      const avgScore = studentAttempts.length > 0
        ? Math.round(studentAttempts.reduce((s, a) => s + a.score, 0) / studentAttempts.length)
        : 0;
      const completedLessons = studentProgress.filter(p => p.is_completed).length;

      return {
        studentId: e.student_id,
        name: `${e.student.first_name} ${e.student.last_name}`,
        grade: e.student.grade,
        avgScore,
        quizAttempts: studentAttempts.length,
        completedLessons,
        status: avgScore >= 70 ? "on-track" : avgScore >= 50 ? "needs-attention" : "at-risk",
      };
    });

    const classAvg = studentStats.length > 0
      ? Math.round(studentStats.reduce((s, st) => s + st.avgScore, 0) / studentStats.length)
      : 0;

    const atRisk = studentStats.filter(s => s.status === "at-risk");
    const onTrack = studentStats.filter(s => s.status === "on-track");

    const system = `You are an expert educational analyst. You analyze class performance data and provide actionable insights for teachers. Respond in valid JSON only.`;

    const prompt = `Analyze this class performance data and provide insights:

Course: ${courses.find(c => c.id === targetCourseId)?.title}
Total students: ${studentStats.length}
Class average score: ${classAvg}%
At-risk students: ${atRisk.length} (${atRisk.map(s => s.name).join(", ")})
On-track students: ${onTrack.length}
Student scores: ${studentStats.map(s => `${s.name}: ${s.avgScore}%`).join(", ")}

Respond in this EXACT JSON format:
{
  "summary": "2-3 sentence class summary",
  "topInsights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "atRiskActions": ["specific action for at-risk students"],
  "nextSteps": "what the teacher should focus on next"
}`;

    const raw = await callGroq(prompt, system);
    const clean = raw.replace(/```json|```/g, "").trim();
    const aiInsights = JSON.parse(clean);

    return NextResponse.json({
      courses,
      selectedCourse: targetCourseId,
      studentStats,
      classAvg,
      atRiskCount: atRisk.length,
      onTrackCount: onTrack.length,
      totalStudents: studentStats.length,
      aiInsights,
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}