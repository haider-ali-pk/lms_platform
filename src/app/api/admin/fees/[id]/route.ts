export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();

  const updated = await prisma.feeTemplate.update({
    where: { id },
    data: {
      grade: body.grade,
      amount: body.amount ? parseFloat(body.amount) : undefined,
      due_day: body.due_day ? parseInt(body.due_day) : undefined,
      title: body.title,
      is_active: body.is_active,
    },
  });

  return NextResponse.json({ template: updated });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  await prisma.feeTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}