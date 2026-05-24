export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const { title, description, is_published } = body;

  const existing = await prisma.course.findFirst({
    where: { id, school_id: user.school_id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (is_published !== undefined) updateData.is_published = is_published;

  const course = await prisma.course.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      title: true,
      description: true,
      is_published: true,
      created_at: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      user_id: user.id,
      action: "UPDATE_COURSE",
      entity: "Course",
      entity_id: id,
      details: `Admin updated course: ${course.title}`,
    },
  });

  return NextResponse.json({ course });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const { student_id } = body;

  if (!student_id) {
    return NextResponse.json({ error: "student_id is required" }, { status: 400 });
  }

  const course = await prisma.course.findFirst({
    where: { id, school_id: user.school_id },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const student = await prisma.user.findFirst({
    where: { id: student_id, school_id: user.school_id, role: "student", deleted_at: null },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const alreadyEnrolled = await prisma.enrollment.findFirst({
    where: { course_id: id, student_id },
  });

  if (alreadyEnrolled) {
    return NextResponse.json({ error: "Student already enrolled" }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.create({
    data: { course_id: id, student_id },
  });

  await prisma.auditLog.create({
    data: {
      user_id: user.id,
      action: "ENROLL_STUDENT",
      entity: "Enrollment",
      entity_id: enrollment.id,
      details: `Admin enrolled student ${student_id} in course ${id}`,
    },
  });

  return NextResponse.json({ enrollment }, { status: 201 });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const student_id = searchParams.get("student_id");

  if (!student_id) {
    return NextResponse.json({ error: "student_id is required" }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { course_id: id, student_id },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  }

  await prisma.enrollment.delete({ where: { id: enrollment.id } });

  await prisma.auditLog.create({
    data: {
      user_id: user.id,
      action: "UNENROLL_STUDENT",
      entity: "Enrollment",
      entity_id: enrollment.id,
      details: `Admin unenrolled student ${student_id} from course ${id}`,
    },
  });

  return NextResponse.json({ message: "Student unenrolled" });
}