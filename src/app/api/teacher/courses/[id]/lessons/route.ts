export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const lessons = await prisma.lesson.findMany({
    where: { course_id: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ lessons });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const course = await prisma.course.findFirst({
    where: { id, author_id: user.id, deleted_at: null },
  });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const body = await req.json();
  const { title, content, video_url, pdf_url, type, duration_min } = body;

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const count = await prisma.lesson.count({ where: { course_id: id } });

  const lesson = await prisma.lesson.create({
    data: {
      course_id: id,
      title,
      content: content || null,
      video_url: video_url || null,
      pdf_url: pdf_url || null,
      type: type || "video",
      duration_min: duration_min ? parseInt(duration_min) : null,
      order: count,
      is_published: false,
    },
  });
  return NextResponse.json({ lesson }, { status: 201 });
}