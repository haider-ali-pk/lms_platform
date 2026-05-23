// src/app/api/parent/stats/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const JWT_SECRET = process.env.JWT_SECRET!;
    return jwt.verify(auth.slice(7), JWT_SECRET) as { id: string; role: string };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "parent") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 1. Get all children linked to this parent
  const parentStudents = await prisma.parentStudent.findMany({
    where: { parent_id: user.id },
    include: {
      student: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          school: { select: { name: true } },
          enrollments: {
            select: {
              id: true,
              enrolled_at: true,
              completed_at: true,
              course: { select: { title: true } },
            },
          },
          attendance_records: {
            select: { status: true },
          },
          quiz_attempts: {
            select: { score: true, passed: true },
          },
          assignments_submitted: {
            select: { status: true, marks: true },
            where: { status: { in: ["submitted", "graded", "late"] } },
          },
        },
      },
    },
  });

  const children = parentStudents.map((ps) => {
    const s = ps.student;

    // Attendance %
    const totalAttendance = s.attendance_records.length;
    const presentCount = s.attendance_records.filter(
      (a) => a.status === "present" || a.status === "late"
    ).length;
    const attendancePct =
      totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null;

    // Average quiz grade %
    const attempts = s.quiz_attempts;
    const avgGrade =
      attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
        : null;

    // Courses in progress (enrolled but not completed)
    const coursesInProgress = s.enrollments.filter((e) => !e.completed_at).length;
    const totalCourses = s.enrollments.length;

    // Pending assignments (missing status — not submitted)
    const pendingAssignments = s.assignments_submitted.filter(
      (a) => a.status === "missing"
    ).length;

    return {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      avatar_url: s.avatar_url,
      school_name: s.school?.name ?? "—",
      attendance_pct: attendancePct,
      avg_grade: avgGrade,
      courses_in_progress: coursesInProgress,
      total_courses: totalCourses,
      pending_assignments: pendingAssignments,
    };
  });

  // Aggregate KPIs across all children
  const totalChildren = children.length;

  const attendanceValues = children.map((c) => c.attendance_pct).filter((v) => v !== null) as number[];
  const avgAttendance =
    attendanceValues.length > 0
      ? Math.round(attendanceValues.reduce((a, b) => a + b, 0) / attendanceValues.length)
      : 0;

  const gradeValues = children.map((c) => c.avg_grade).filter((v) => v !== null) as number[];
  const avgGrade =
    gradeValues.length > 0
      ? Math.round(gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length)
      : 0;

  const totalCoursesInProgress = children.reduce((sum, c) => sum + c.courses_in_progress, 0);
  const totalPendingAssignments = children.reduce((sum, c) => sum + c.pending_assignments, 0);

  return NextResponse.json({
    kpis: {
      total_children: totalChildren,
      avg_attendance: avgAttendance,
      avg_grade: avgGrade,
      courses_in_progress: totalCoursesInProgress,
      pending_assignments: totalPendingAssignments,
    },
    children,
  });
}