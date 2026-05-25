export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courses = await prisma.course.findMany({
    where: { author_id: user.id, deleted_at: null },
    select: { id: true, title: true, subject: true },
    orderBy: { title: "asc" },
  });

  return NextResponse.json({ courses });
}