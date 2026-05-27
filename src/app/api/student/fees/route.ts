export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Auto-mark overdue fees
  await prisma.feePayment.updateMany({
    where: {
      student_id: user.id,
      status: "pending",
      due_date: { lt: new Date() },
    },
    data: { status: "overdue" },
  });

  const fees = await prisma.feePayment.findMany({
    where: { student_id: user.id },
    orderBy: { due_date: "desc" },
    include: { fee_template: { select: { title: true, grade: true } } },
  });

  const totalDue = fees.filter(f => f.status !== "paid").reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.filter(f => f.status === "paid").reduce((s, f) => s + f.amount, 0);
  const hasOverdue = fees.some(f => f.status === "overdue");
  const nextDue = fees.find(f => f.status === "pending");

  return NextResponse.json({ fees, totalDue, totalPaid, hasOverdue, nextDue });
}