export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { getUserFromRequest } from "@/app/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all courses by this teacher
    const courses = await prisma.course.findMany({
      where: { author_id: user.id, deleted_at: null },
      select: { id: true, title: true },
    })

    const courseIds = courses.map((c) => c.id)

    // Get all assignments for these courses
    const assignments = await prisma.assignment.findMany({
      where: { course_id: { in: courseIds } },
      select: {
        id: true,
        title: true,
        description: true,
        due_date: true,
        max_marks: true,
        is_published: true,
        created_at: true,
        course: { select: { id: true, title: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { due_date: "asc" },
    })

    return NextResponse.json({
      assignments: assignments.map((a) => ({
        id:          a.id,
        title:       a.title,
        description: a.description,
        due_date:    a.due_date,
        max_marks:   a.max_marks,
        is_published: a.is_published,
        created_at:  a.created_at,
        course_id:   a.course.id,
        course:      a.course.title,
        submissions: a._count.submissions,
      })),
      courses,
    })
  } catch (error) {
    console.error("GET /teacher/assignments error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, due_date, max_marks, course_id, is_published } = body

    if (!title || !description || !due_date || !course_id) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 })
    }

    // Verify teacher owns this course
    const course = await prisma.course.findFirst({
      where: { id: course_id, author_id: user.id, deleted_at: null },
    })
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        due_date:    new Date(due_date),
        max_marks:   max_marks || 100,
        course_id,
        is_published: is_published || false,
      },
    })

    return NextResponse.json({ success: true, assignment })
  } catch (error) {
    console.error("POST /teacher/assignments error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}