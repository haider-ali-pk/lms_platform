export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { student_id, amount, due_date, notes } = await req.json();
  if (!student_id || !amount || !due_date) return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const fee = await prisma.feePayment.create({
    data: {
      student_id,
      school_id: user.school_id,
      amount: parseFloat(amount),
      due_date: new Date(due_date),
      notes,
      status: "pending",
    },
  });

  return NextResponse.json({ fee });
}