export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const { title, description, subject, grade_level, thumbnail_url, is_published } = body;

  const course = await prisma.course.findFirst({
    where: { id, author_id: user.id, deleted_at: null },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const updated = await prisma.course.update({
    where: { id },
    data: { title, description, subject, grade_level, thumbnail_url, is_published },
  });

  return NextResponse.json({ course: updated });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const course = await prisma.course.findFirst({
    where: { id, author_id: user.id, deleted_at: null },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  await prisma.course.update({
    where: { id },
    data: { deleted_at: new Date() },
  });

  return NextResponse.json({ success: true });
}