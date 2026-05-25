export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: user.id },
      include: {
        course: {
          include: {
            lessons: { where: { is_published: true }, select: { id: true } },
            author: { select: { first_name: true, last_name: true } },
          },
        },
      },
      orderBy: { enrolled_at: "desc" },
    });

    const courses = await Promise.all(enrollments.map(async (e) => {
      const totalLessons = e.course.lessons.length;
      const completedLessons = await prisma.lessonProgress.count({
        where: { student_id: user.id, lesson: { course_id: e.course_id }, is_completed: true },
      });
      return {
        id: e.course.id,
        title: e.course.title,
        description: e.course.description,
        thumbnail_url: e.course.thumbnail_url,
        subject: e.course.subject,
        grade_level: e.course.grade_level,
        author: `${e.course.author.first_name} ${e.course.author.last_name}`,
        enrolled_at: e.enrolled_at,
        completed_at: e.completed_at,
        totalLessons,
        completedLessons,
        progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      };
    }));

    return NextResponse.json({ courses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}