export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !["admin", "super_admin"].includes(user.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch enrollments first, filtered by school
    const enrollments = await prisma.enrollment.findMany({
      where: user.role === "admin"
        ? { student: { school_id: user.school_id, deleted_at: null } }
        : { student: { deleted_at: null } },
      select: {
        student_id: true,
        course_id: true,
        course: { select: { id: true, title: true } },
        student: { select: { id: true, first_name: true, last_name: true, avatar_url: true } },
      },
    });

    // Group by student
    const studentMap = new Map<string, any>();
    for (const e of enrollments) {
      if (!studentMap.has(e.student_id)) {
        studentMap.set(e.student_id, {
          id: e.student.id,
          first_name: e.student.first_name,
          last_name: e.student.last_name,
          avatar_url: e.student.avatar_url,
          enrollments: [],
        });
      }
      studentMap.get(e.student_id).enrollments.push({
        course_id: e.course_id,
        course: e.course,
      });
    }

    const students = Array.from(studentMap.values())
      .sort((a, b) => a.first_name.localeCompare(b.first_name));

    return NextResponse.json({ students });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}