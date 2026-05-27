export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [templates, payments, students] = await Promise.all([
    prisma.feeTemplate.findMany({
      where: { school_id: user.school_id },
      orderBy: { grade: "asc" },
    }),
    prisma.feePayment.findMany({
      where: { school_id: user.school_id },
      include: { student: { select: { id: true, first_name: true, last_name: true, email: true, grade: true } } },
      orderBy: { due_date: "desc" },
    }),
    prisma.user.findMany({
      where: { school_id: user.school_id, role: "student" },
      select: { id: true, first_name: true, last_name: true, email: true, grade: true, is_active: true },
      orderBy: { first_name: "asc" },
    }),
  ]);

  const totalCollected = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === "overdue").reduce((s, p) => s + p.amount, 0);
  const overdueCount = payments.filter(p => p.status === "overdue").length;

  return NextResponse.json({ templates, payments, students, totalCollected, totalPending, totalOverdue, overdueCount });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { grade, amount, due_day, title } = await req.json();
  if (!grade || !amount || !due_day || !title) return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const template = await prisma.feeTemplate.create({
    data: { school_id: user.school_id, grade, amount: parseFloat(amount), due_day: parseInt(due_day), title },
  });

  return NextResponse.json({ template });
}