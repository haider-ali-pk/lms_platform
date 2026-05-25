export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: user.id, course_id: id } },
    });
    if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 403 });

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        author: { select: { first_name: true, last_name: true, avatar_url: true } },
        lessons: {
          where: { is_published: true },
          orderBy: { order: "asc" },
          include: { progress: { where: { student_id: user.id } } },
        },
      },
    });

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const lessons = course.lessons.map(l => ({
      id: l.id,
      title: l.title,
      type: l.type,
      duration_min: l.duration_min,
      order: l.order,
      is_completed: l.progress[0]?.is_completed || false,
    }));

    const completedCount = lessons.filter(l => l.is_completed).length;

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        subject: course.subject,
        grade_level: course.grade_level,
        pass_mark: course.pass_mark,
        author: `${course.author.first_name} ${course.author.last_name}`,
        author_avatar: course.author.avatar_url,
        enrolled_at: enrollment.enrolled_at,
        completed_at: enrollment.completed_at,
        totalLessons: lessons.length,
        completedLessons: completedCount,
        progress: lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0,
        lessons,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}