export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !["admin", "super_admin"].includes(user.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const where = user.role === "admin" ? { student: { school_id: user.school_id } } : {};

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        student: { select: { id: true, first_name: true, last_name: true, avatar_url: true, school_id: true } },
        course: { select: { id: true, title: true, thumbnail_url: true } },
        issuer: { select: { first_name: true, last_name: true, role: true } },
      },
      orderBy: { issued_at: "desc" },
    });

    return NextResponse.json({ certificates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !["admin", "super_admin"].includes(user.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { student_id, course_id, grade, score } = await req.json();
    if (!student_id || !course_id)
      return NextResponse.json({ error: "student_id and course_id are required" }, { status: 400 });

    // Check student is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id, course_id } },
    });
    if (!enrollment)
      return NextResponse.json({ error: "Student is not enrolled in this course" }, { status: 400 });

    // Upsert — re-issue if already exists
    const cert = await prisma.certificate.upsert({
      where: { student_id_course_id: { student_id, course_id } },
      update: { issuer_id: user.id, grade: grade ?? null, score: score ?? 0, status: "issued", issued_at: new Date() },
      create: { student_id, course_id, issuer_id: user.id, grade: grade ?? null, score: score ?? 0, status: "issued" },
    });

    return NextResponse.json({ certificate: cert });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}