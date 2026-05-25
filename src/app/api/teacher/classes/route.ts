export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const classes = await prisma.class.findMany({
    where: {
      teachers: {
        some: { teacher_id: user.id },
      },
    },
    include: {
      teachers: {
        include: {
          teacher: {
            select: { id: true, first_name: true, last_name: true, avatar_url: true },
          },
        },
      },
      attendance: {
        select: { student_id: true },
        distinct: ["student_id"],
      },
      _count: {
        select: { attendance: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ classes });
}