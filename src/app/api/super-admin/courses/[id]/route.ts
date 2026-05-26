export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { getUserFromRequest } from "@/app/lib/auth"

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        subject: true,
        grade_level: true,
        is_published: true,
        created_at: true,
        school: { select: { id: true, name: true } },
        _count: { select: { lessons: true, enrollments: true } },
        enrollments: {
          select: {
            id: true,
            enrolled_at: true,
            completed_at: true,
            student: {
              select: { id: true, first_name: true, last_name: true, email: true },
            },
          },
          orderBy: { enrolled_at: "desc" },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const lessonTotal = course._count.lessons

    const enrollments = await Promise.all(
      course.enrollments.map(async (e) => {
        const completedLessons = await prisma.lessonProgress.count({
          where: {
            student_id: e.student.id,
            lesson: { course_id: id },
            is_completed: true,
          },
        })
        return {
          id:            e.id,
          enrolled_at:   e.enrolled_at,
          completed_at:  e.completed_at,
          student_id:    e.student.id,
          first_name:    e.student.first_name,
          last_name:     e.student.last_name,
          email:         e.student.email,
          lessons_done:  completedLessons,
          lessons_total: lessonTotal,
          progress_pct:  lessonTotal > 0 ? Math.round((completedLessons / lessonTotal) * 100) : 0,
        }
      })
    )

    return NextResponse.json({
      id:           course.id,
      title:        course.title,
      subject:      course.subject,
      grade_level:  course.grade_level,
      is_published: course.is_published,
      created_at:   course.created_at,
      school_id:    course.school.id,
      school:       course.school.name,
      lessons:      course._count.lessons,
      enrollments,
    })
  } catch (error) {
    console.error("GET /super-admin/courses/[id] error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, subject, grade_level, is_published } = body

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(title        !== undefined && { title }),
        ...(subject      !== undefined && { subject }),
        ...(grade_level  !== undefined && { grade_level }),
        ...(is_published !== undefined && { is_published }),
      },
    })

    return NextResponse.json({ success: true, course: updated })
  } catch (error) {
    console.error("PUT /super-admin/courses/[id] error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
