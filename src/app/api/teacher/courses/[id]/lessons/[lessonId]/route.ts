export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string; lessonId: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, lessonId } = await context.params;
  const body = await req.json();
  const { title, content, video_url, pdf_url, type, duration_min, is_published } = body;

  const lesson = await prisma.lesson.update({
    where: { id: lessonId, course_id: id },
    data: { title, content, video_url, pdf_url, type, duration_min: duration_min ? parseInt(duration_min) : null, is_published },
  });
  return NextResponse.json({ lesson });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string; lessonId: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { lessonId } = await context.params;
  await prisma.lesson.delete({ where: { id: lessonId } });
  return NextResponse.json({ success: true });
}