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
      select: { course_id: true },
    });
    const courseIds = enrollments.map(e => e.course_id);

    const assignments = await prisma.assignment.findMany({
      where: { course_id: { in: courseIds }, is_published: true },
      include: {
        course: { select: { title: true, subject: true } },
        submissions: { where: { student_id: user.id } },
      },
      orderBy: { due_date: "asc" },
    });

    const result = assignments.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      due_date: a.due_date,
      max_marks: a.max_marks,
      course_title: a.course.title,
      course_subject: a.course.subject,
      submission: a.submissions[0] || null,
    }));

    return NextResponse.json({ assignments: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}