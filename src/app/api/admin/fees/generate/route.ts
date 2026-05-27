export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { template_id, month, year } = await req.json();

  const template = await prisma.feeTemplate.findUnique({ where: { id: template_id } });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const students = await prisma.user.findMany({
    where: { school_id: user.school_id, role: "student", grade: template.grade, is_active: true },
  });

  if (students.length === 0) return NextResponse.json({ error: `No active students found in grade ${template.grade}` }, { status: 404 });

  const dueDate = new Date(year, month - 1, template.due_day);
  let created = 0;
  let skipped = 0;

  for (const student of students) {
    const existing = await prisma.feePayment.findFirst({
      where: {
        student_id: student.id,
        fee_template_id: template_id,
        due_date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
      },
    });

    if (existing) { skipped++; continue; }

    await prisma.feePayment.create({
      data: {
        student_id: student.id,
        school_id: user.school_id,
        fee_template_id: template_id,
        amount: template.amount,
        due_date: dueDate,
        status: "pending",
      },
    });
    created++;
  }

  return NextResponse.json({ success: true, created, skipped, total: students.length });
}