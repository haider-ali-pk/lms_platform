export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  // Verify teacher is assigned to this class
  const classTeacher = await prisma.classTeacher.findFirst({
    where: { class_id: id, teacher_id: user.id },
  });
  if (!classTeacher) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Get unique students from attendance records
  const attendanceRecords = await prisma.attendance.findMany({
    where: { class_id: id },
    select: { student_id: true },
    distinct: ["student_id"],
  });

  const studentIds = attendanceRecords.map((a) => a.student_id);

  const students = await prisma.user.findMany({
    where: {
      id: { in: studentIds },
      role: "student",
      deleted_at: null,
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      avatar_url: true,
      is_active: true,
    },
    orderBy: { first_name: "asc" },
  });

  // Get attendance summary per student for this class
  const summaries = await Promise.all(
    students.map(async (s) => {
      const records = await prisma.attendance.findMany({
        where: { class_id: id, student_id: s.id },
        select: { status: true },
      });
      const present = records.filter((r) => r.status === "present").length;
      const absent = records.filter((r) => r.status === "absent").length;
      const late = records.filter((r) => r.status === "late").length;
      const total = records.length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      return { ...s, present, absent, late, total, rate };
    })
  );

  return NextResponse.json({ students: summaries });
}