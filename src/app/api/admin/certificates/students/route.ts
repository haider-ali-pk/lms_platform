export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !["admin", "super_admin"].includes(user.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const where = user.role === "admin"
      ? { role: "student" as const, school_id: user.school_id, deleted_at: null }
      : { role: "student" as const, deleted_at: null };

    const students = await prisma.user.findMany({
      where,
      select: { id: true, first_name: true, last_name: true, avatar_url: true,
        enrollments: { select: { course_id: true, course: { select: { id: true, title: true } } } },
      },
      orderBy: { first_name: "asc" },
      take: 200,
    });

    return NextResponse.json({ students });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}