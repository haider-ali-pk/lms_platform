export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "parent") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const links = await prisma.parentStudent.findMany({
      where: { parent_id: user.id },
      include: {
        student: {
          select: {
            id: true, first_name: true, last_name: true,
            school: { select: { name: true } },
            attendance_records: { select: { status: true } },
            quiz_attempts: { select: { score: true, quiz: { select: { course: { select: { subject: true } } } } } },
            enrollments: { select: { completed_at: true, course: { select: { subject: true } } } },
            assignments_submitted: { select: { status: true } },
            certificates: { select: { id: true } },
          },
        },
      },
    });

    const reports = links.map(({ student: s }) => {
      const total = s.attendance_records.length;
      const present = s.attendance_records.filter(a => a.status === "present" || a.status === "late").length;
      const attempts = s.quiz_attempts;
      const avgQuiz = attempts.length > 0 ? Math.round(attempts.reduce((a, b) => a + b.score, 0) / attempts.length) : null;

      // Top subject by quiz attempts
      const subjectCount: Record<string, number> = {};
      attempts.forEach(a => {
        const subj = a.quiz.course?.subject ?? "Unknown";
        subjectCount[subj] = (subjectCount[subj] ?? 0) + 1;
      });
      const topSubject = Object.entries(subjectCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      return {
        child_id: s.id,
        child_name: `${s.first_name} ${s.last_name}`,
        school_name: s.school?.name ?? "—",
        attendance_pct: total > 0 ? Math.round(present / total * 100) : null,
        avg_quiz_score: avgQuiz,
        courses_completed: s.enrollments.filter(e => e.completed_at).length,
        total_courses: s.enrollments.length,
        assignments_submitted: s.assignments_submitted.filter(a => ["submitted", "graded"].includes(a.status)).length,
        assignments_graded: s.assignments_submitted.filter(a => a.status === "graded").length,
        certificates: s.certificates.length,
        top_subject: topSubject,
      };
    });

    return NextResponse.json({ reports });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}