export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Enrolled courses with lesson progress
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: user.id },
      include: {
        course: {
          include: {
            lessons: { where: { is_published: true }, select: { id: true, title: true } },
          },
        },
      },
    });

    const courseProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const totalLessons = enrollment.course.lessons.length;
        const completedLessons = await prisma.lessonProgress.count({
          where: { student_id: user.id, lesson: { course_id: enrollment.course_id }, is_completed: true },
        });
        const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        return {
          courseId: enrollment.course_id,
          title: enrollment.course.title,
          thumbnail: enrollment.course.thumbnail_url ?? null,
          totalLessons,
          completedLessons,
          percent,
          enrolledAt: enrollment.enrolled_at,
          completedAt: enrollment.completed_at,
        };
      })
    );

    // Assignments — schema uses `marks` not `marks_obtained`, `max_marks` not `total_marks`
    const assignments = await prisma.assignmentSubmission.findMany({
      where: { student_id: user.id },
      include: { assignment: { select: { title: true, max_marks: true } } },
      orderBy: { submitted_at: "desc" },
    });
    const totalAssignments = assignments.length;
    const gradedAssignments = assignments.filter((a) => a.status === "graded");
    const avgAssignmentScore =
      gradedAssignments.length > 0
        ? Math.round(
            gradedAssignments.reduce((sum, a) => sum + (a.marks ?? 0) / (a.assignment.max_marks ?? 100), 0) /
              gradedAssignments.length * 100
          )
        : 0;

    // Quizzes — schema: score, passed, submitted_at (no is_completed / completed_at / total_marks)
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { student_id: user.id },
      include: { quiz: { select: { title: true, pass_mark: true } } },
      orderBy: { submitted_at: "desc" },
    });
    const totalQuizzes = quizAttempts.length;
    const avgQuizScore =
      totalQuizzes > 0
        ? Math.round(quizAttempts.reduce((a, q) => a + (q.score ?? 0), 0) / totalQuizzes)
        : 0;

    const overallPercent =
      courseProgress.length > 0
        ? Math.round(courseProgress.reduce((s, c) => s + c.percent, 0) / courseProgress.length)
        : 0;

    return NextResponse.json({
      overallPercent,
      totalCourses: courseProgress.length,
      completedCourses: courseProgress.filter((c) => c.percent === 100).length,
      totalAssignments,
      gradedAssignments: gradedAssignments.length,
      avgAssignmentScore,
      totalQuizzes,
      avgQuizScore,
      courseProgress,
      recentAssignments: assignments.slice(0, 5).map((a) => ({
        title: a.assignment.title,
        status: a.status,
        marks: a.marks ?? null,
        total: a.assignment.max_marks ?? null,
        submittedAt: a.submitted_at,
      })),
      recentQuizzes: quizAttempts.slice(0, 5).map((q) => ({
        title: q.quiz.title,
        score: q.score ?? 0,
        total: 100,
        passed: q.passed,
        completedAt: q.submitted_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}