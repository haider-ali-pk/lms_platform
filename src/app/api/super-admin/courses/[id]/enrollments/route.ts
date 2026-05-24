export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { getUserFromRequest } from "@/app/lib/auth"

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") || ""

    if (!query || query.length < 2) {
      return NextResponse.json({ students: [] })
    }

    const course = await prisma.course.findUnique({
      where: { id },
      select: { school_id: true },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const alreadyEnrolled = await prisma.enrollment.findMany({
      where: { course_id: id },
      select: { student_id: true },
    })
    const enrolledIds = alreadyEnrolled.map((e) => e.student_id)

    const students = await prisma.user.findMany({
      where: {
        school_id: course.school_id,
        role: "student",
        deleted_at: null,
        id: { notIn: enrolledIds.length > 0 ? enrolledIds : ["__none__"] },
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { first_name: { contains: query, mode: "insensitive" } },
          { last_name: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, first_name: true, last_name: true, email: true },
      take: 10,
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error("GET /enrollments search error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { student_id } = await req.json()
    if (!student_id) {
      return NextResponse.json({ error: "student_id required" }, { status: 400 })
    }

    const existing = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id, course_id: id } },
    })
    if (existing) {
      return NextResponse.json({ error: "Student already enrolled" }, { status: 409 })
    }

    const enrollment = await prisma.enrollment.create({
      data: { student_id, course_id: id },
    })

    return NextResponse.json({ success: true, enrollment })
  } catch (error) {
    console.error("POST /enrollments error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { student_id } = await req.json()
    if (!student_id) {
      return NextResponse.json({ error: "student_id required" }, { status: 400 })
    }

    await prisma.enrollment.delete({
      where: { student_id_course_id: { student_id, course_id: id } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /enrollments error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
