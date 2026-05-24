export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

function buildSummary(records: Array<{ status: string }>) {
  return {
    present: records.filter((r) => r.status === "present").length,
    absent:  records.filter((r) => r.status === "absent").length,
    late:    records.filter((r) => r.status === "late").length,
    excused: records.filter((r) => r.status === "excused").length,
    total:   records.length,
  };
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const view       = searchParams.get("view") ?? "class";
  const class_id   = searchParams.get("class_id") ?? "";
  const student_id = searchParams.get("student_id") ?? "";
  const from       = searchParams.get("from") ?? "";
  const to         = searchParams.get("to") ?? "";

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    dateFilter.lte = toDate;
  }
  const hasDate = Object.keys(dateFilter).length > 0;

  // ── CLASS VIEW ──────────────────────────────────────────────────────
  if (view === "class") {
    if (!class_id) {
      const classes = await prisma.class.findMany({
        where: { school_id: user.school_id! },
        select: { id: true, name: true, grade: true, section: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ classes });
    }

    const records = await prisma.attendance.findMany({
      where: {
        class_id,
        class: { school_id: user.school_id! },
        ...(hasDate && { date: dateFilter }),
      },
      include: {
        student: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const summary = buildSummary(records);

    // Per-student breakdown
    const studentMap: any = {};
    for (const r of records) {
      const sid = r.student.id;
      if (!studentMap[sid]) {
        studentMap[sid] = {
          student: r.student,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
        };
      }
      if (r.status === "present") studentMap[sid].present++;
      else if (r.status === "absent") studentMap[sid].absent++;
      else if (r.status === "late") studentMap[sid].late++;
      else if (r.status === "excused") studentMap[sid].excused++;
      studentMap[sid].total++;
    }

    // Daily trend
    const dailyMap: any = {};
    for (const r of records) {
      const day = r.date.toISOString().split("T")[0];
      if (!dailyMap[day]) {
        dailyMap[day] = { date: day, present: 0, absent: 0, late: 0, excused: 0 };
      }
      if (r.status === "present") dailyMap[day].present++;
      else if (r.status === "absent") dailyMap[day].absent++;
      else if (r.status === "late") dailyMap[day].late++;
      else if (r.status === "excused") dailyMap[day].excused++;
    }

    const daily = Object.values(dailyMap).sort((a: any, b: any) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      summary,
      students: Object.values(studentMap),
      daily,
    });
  }

  // ── STUDENT VIEW ────────────────────────────────────────────────────
  if (view === "student") {
    if (!student_id) {
      const students = await prisma.user.findMany({
        where: {
          school_id: user.school_id!,
          role: "student",
          deleted_at: null,
          is_active: true,
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
        },
        orderBy: { first_name: "asc" },
        take: 200,
      });
      return NextResponse.json({ students });
    }

    const records = await prisma.attendance.findMany({
      where: {
        student_id,
        class: { school_id: user.school_id! },
        ...(hasDate && { date: dateFilter }),
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const summary = buildSummary(records);

    const student = await prisma.user.findUnique({
      where: { id: student_id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
      },
    });

    return NextResponse.json({ summary, records, student });
  }

  return NextResponse.json({ error: "Invalid view" }, { status: 400 });
}