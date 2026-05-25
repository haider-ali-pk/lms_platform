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
  const assignments = await prisma.assignment.findMany({
    where: { course_id: id },
    include: { _count: { select: { submissions: true } } },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json({ assignments });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await req.json();
  const { title, description, due_date, max_marks } = body;

  if (!title || !description || !due_date) {
    return NextResponse.json({ error: "title, description and due_date required" }, { status: 400 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      course_id: id,
      title,
      description,
      due_date: new Date(due_date),
      max_marks: max_marks ? parseInt(max_marks) : 100,
      is_published: false,
    },
  });
  return NextResponse.json({ assignment }, { status: 201 });
}