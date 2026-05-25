export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = await prisma.course.findMany({
    where: { author_id: user.id, deleted_at: null },
    include: {
      _count: {
        select: { lessons: true, enrollments: true, assignments: true },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, subject, grade_level, thumbnail_url } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const course = await prisma.course.create({
    data: {
      title,
      description: description || null,
      subject: subject || null,
      grade_level: grade_level || null,
      thumbnail_url: thumbnail_url || null,
      school_id: user.school_id!,
      author_id: user.id,
      is_published: false,
    },
  });

  return NextResponse.json({ course }, { status: 201 });
}