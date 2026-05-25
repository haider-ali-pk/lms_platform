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
            email: true, avatar_url: true,
            school: { select: { name: true } },
            attendance_records: { select: { status: true } },
            quiz_attempts: { select: { score: true } },
            enrollments: { select: { id: true, completed_at: true } },
            assignments_submitted: { select: { status: true } },
          },
        },
      },
    });

    const children = links.map(({ student: s }) => {
      const total = s.attendance_records.length;
      const present = s.attendance_records.filter(a => a.status === "present" || a.status === "late").length;
      const attempts = s.quiz_attempts;
      return {
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        email: s.email,
        avatar_url: s.avatar_url,
        school_name: s.school?.name ?? "—",
        attendance_pct: total > 0 ? Math.round(present / total * 100) : null,
        avg_grade: attempts.length > 0 ? Math.round(attempts.reduce((a, b) => a + b.score, 0) / attempts.length) : null,
        courses_in_progress: s.enrollments.filter(e => !e.completed_at).length,
        total_courses: s.enrollments.length,
        pending_assignments: s.assignments_submitted.filter(a => a.status === "missing").length,
      };
    });

    return NextResponse.json({ children });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}