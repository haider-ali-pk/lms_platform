export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Manually issued certificates
    const manualCerts = await prisma.certificate.findMany({
      where: { student_id: user.id },
      include: {
        course: { select: { title: true, thumbnail_url: true } },
        issuer: { select: { first_name: true, last_name: true, role: true } },
      },
      orderBy: { issued_at: "desc" },
    });

    // Auto-earned: course 100% complete + all quizzes passed
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: user.id, completed_at: { not: null } },
      include: {
        course: {
          include: {
            lessons: { where: { is_published: true }, select: { id: true } },
            quizzes: { select: { id: true, pass_mark: true } },
          },
        },
      },
    });

    const autoCerts = await Promise.all(
      enrollments.map(async (enrollment) => {
        const totalLessons = enrollment.course.lessons.length;
        const completedLessons = await prisma.lessonProgress.count({
          where: { student_id: user.id, lesson: { course_id: enrollment.course_id }, is_completed: true },
        });
        if (totalLessons === 0 || completedLessons < totalLessons) return null;

        // Check all quizzes passed
        const quizzes = enrollment.course.quizzes;
        if (quizzes.length > 0) {
          for (const quiz of quizzes) {
            const attempt = await prisma.quizAttempt.findFirst({
              where: { student_id: user.id, quiz_id: quiz.id, passed: true },
            });
            if (!attempt) return null;
          }
        }

        // Skip if already manually issued
        if (manualCerts.find((c) => c.course_id === enrollment.course_id)) return null;

        return {
          id: `auto_${enrollment.course_id}`,
          courseId: enrollment.course_id,
          title: enrollment.course.title,
          thumbnail: enrollment.course.thumbnail_url ?? null,
          issuedAt: enrollment.completed_at!,
          issuedBy: "System",
          issuerRole: "auto",
          grade: null,
          type: "auto" as const,
        };
      })
    );

    const combined = [
      ...manualCerts.map((c) => ({
        id: c.id,
        courseId: c.course_id,
        title: c.course.title,
        thumbnail: c.course.thumbnail_url ?? null,
        issuedAt: c.issued_at,
        issuedBy: c.issuer ? `${c.issuer.first_name} ${c.issuer.last_name}` : "System",
        issuerRole: c.issuer?.role ?? "auto",
        grade: c.grade ?? null,
        type: "manual" as const,
      })),
      ...autoCerts.filter(Boolean),
    ];

    return NextResponse.json({ certificates: combined });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}