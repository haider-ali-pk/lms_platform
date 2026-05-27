export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { student_id } = await req.json();

  await prisma.user.update({
    where: { id: student_id },
    data: { is_active: true },
  });

  await prisma.auditLog.create({
    data: {
      user_id: user.id,
      school_id: user.school_id,
      action: "STUDENT_UNBLOCKED",
      entity: "User",
      entity_id: student_id,
      meta: { unblocked_by: user.id, reason: "manual_admin_unblock" },
    },
  });

  return NextResponse.json({ success: true });
}