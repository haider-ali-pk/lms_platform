export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "parent") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const childId = req.nextUrl.searchParams.get("child_id");
    if (!childId) return NextResponse.json({ error: "child_id required" }, { status: 400 });

    const link = await prisma.parentStudent.findUnique({
      where: { parent_id_student_id: { parent_id: user.id, student_id: childId } },
    });
    if (!link) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const records = await prisma.attendance.findMany({
      where: { student_id: childId },
      include: { class: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 60,
    });

    const total = records.length;
    const present = records.filter(r => r.status === "present").length;
    const absent = records.filter(r => r.status === "absent").length;
    const late = records.filter(r => r.status === "late").length;
    const excused = records.filter(r => r.status === "excused").length;

    return NextResponse.json({
      attendance: {
        total, present, absent, late, excused,
        pct: total > 0 ? Math.round((present + late) / total * 100) : 0,
        records: records.map(r => ({
          date: r.date.toISOString(),
          status: r.status,
          note: r.note,
          class_name: r.class.name,
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}