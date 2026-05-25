export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { getUserFromRequest } from "@/app/lib/auth"

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = getUserFromRequest(req)
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        due_date: true,
        max_marks: true,
        is_published: true,
        course: { select: { id: true, title: true, author_id: true } },
        submissions: {
          select: {
            id: true,
            status: true,
            marks: true,
            feedback: true,
            submitted_at: true,
            graded_at: true,
            file_url: true,
            text_answer: true,
            student: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
          orderBy: { submitted_at: "desc" },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (assignment.course.author_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error("GET /teacher/assignments/[id] error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = getUserFromRequest(req)
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { type } = body

    // ── Edit assignment ─────────────────────────────────────────
    if (type === "edit") {
      const { title, description, due_date, max_marks, is_published } = body
      const updated = await prisma.assignment.update({
        where: { id },
        data: {
          ...(title        !== undefined && { title }),
          ...(description  !== undefined && { description }),
          ...(due_date     !== undefined && { due_date: new Date(due_date) }),
          ...(max_marks    !== undefined && { max_marks }),
          ...(is_published !== undefined && { is_published }),
        },
      })
      return NextResponse.json({ success: true, assignment: updated })
    }

    // ── Grade submission ────────────────────────────────────────
    if (type === "grade") {
      const { submission_id, marks, feedback } = body
      const updated = await prisma.assignmentSubmission.update({
        where: { id: submission_id },
        data: {
          marks,
          feedback,
          status:    "graded",
          graded_at: new Date(),
        },
      })
      return NextResponse.json({ success: true, submission: updated })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("PUT /teacher/assignments/[id] error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = getUserFromRequest(req)
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.assignment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /teacher/assignments/[id] error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}