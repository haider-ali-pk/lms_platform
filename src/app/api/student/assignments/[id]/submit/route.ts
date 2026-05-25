export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const { text_answer, file_url } = await req.json();

    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    const isLate = new Date() > new Date(assignment.due_date);

    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignment_id_student_id: { assignment_id: id, student_id: user.id } },
      update: { text_answer, file_url, status: isLate ? "late" : "submitted", submitted_at: new Date() },
      create: { assignment_id: id, student_id: user.id, text_answer, file_url, status: isLate ? "late" : "submitted" },
    });

    return NextResponse.json({ submission });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}