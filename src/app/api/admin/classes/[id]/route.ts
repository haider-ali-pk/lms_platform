export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const {
    name,
    grade,
    section,
    academic_year,
    assign_teacher_id,
    unassign_teacher_id,
    add_student_id,
    remove_student_id,
  } = body;

  // Verify class belongs to this school
  const existing = await prisma.class.findFirst({
    where: { id, school_id: user.school_id! },
  });
  if (!existing) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  // Assign teacher
  if (assign_teacher_id) {
    await prisma.classTeacher.upsert({
      where: {
        class_id_teacher_id: { class_id: id, teacher_id: assign_teacher_id },
      },
      update: {},
      create: { class_id: id, teacher_id: assign_teacher_id },
    });
    return NextResponse.json({ success: true });
  }

  // Unassign teacher
  if (unassign_teacher_id) {
    await prisma.classTeacher.deleteMany({
      where: { class_id: id, teacher_id: unassign_teacher_id },
    });
    return NextResponse.json({ success: true });
  }

  // Add student — create a placeholder attendance record for today
  if (add_student_id) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.attendance.upsert({
      where: {
        class_id_student_id_date: {
          class_id: id,
          student_id: add_student_id,
          date: today,
        },
      },
      update: {},
      create: {
        class_id: id,
        student_id: add_student_id,
        date: today,
        status: "present",
      },
    });
    return NextResponse.json({ success: true });
  }

  // Remove student — delete all attendance for this student in this class
  if (remove_student_id) {
    await prisma.attendance.deleteMany({
      where: { class_id: id, student_id: remove_student_id },
    });
    return NextResponse.json({ success: true });
  }

  // Edit class details
  const updated = await prisma.class.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      grade: grade ?? existing.grade,
      section: section ?? existing.section,
      academic_year: academic_year ?? existing.academic_year,
    },
  });

  return NextResponse.json({ class: updated });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await prisma.class.findFirst({
    where: { id, school_id: user.school_id! },
  });
  if (!existing) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  await prisma.class.delete({ where: { id } });
  return NextResponse.json({ success: true });
}