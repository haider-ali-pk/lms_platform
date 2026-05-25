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

    const { searchParams } = new URL(req.url)
    const class_id = searchParams.get("class_id")
    const date     = searchParams.get("date") // YYYY-MM-DD

    if (!class_id || !date) {
      return NextResponse.json({ error: "class_id and date required" }, { status: 400 })
    }

    // Verify teacher owns this class
    const classTeacher = await prisma.classTeacher.findUnique({
      where: { class_id_teacher_id: { class_id, teacher_id: user.id } },
    })
    if (!classTeacher) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get class info
    const classInfo = await prisma.class.findUnique({
      where: { id: class_id },
      select: { id: true, name: true, grade: true, section: true, academic_year: true },
    })

    // Get all students in this class via attendance history or school
    // Students are linked to class via Attendance records or we get school students
    // Since Class has no direct student relation, get students from school with same grade
    const classData = await prisma.class.findUnique({
      where: { id: class_id },
      select: { school_id: true, grade: true },
    })

    const students = await prisma.user.findMany({
      where: {
        school_id: classData?.school_id,
        role: "student",
        deleted_at: null,
        is_active: true,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
      orderBy: { first_name: "asc" },
    })

    // Get existing attendance for this date
    const targetDate = new Date(date)
    const existing = await prisma.attendance.findMany({
      where: {
        class_id,
        date: targetDate,
      },
      select: {
        id: true,
        student_id: true,
        status: true,
        note: true,
      },
    })

    const attendanceMap: Record<string, { id: string; status: string; note: string | null }> = {}
    for (const a of existing) {
      attendanceMap[a.student_id] = { id: a.id, status: a.status, note: a.note }
    }

    // Get attendance summary for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const summary = await prisma.attendance.groupBy({
      by: ["status"],
      where: { class_id, date: { gte: thirtyDaysAgo } },
      _count: { status: true },
    })

    const summaryMap: Record<string, number> = {}
    for (const s of summary) {
      summaryMap[s.status] = s._count.status
    }

    // Get recent dates that have attendance records
    const recentDates = await prisma.attendance.findMany({
      where: { class_id },
      select: { date: true },
      distinct: ["date"],
      orderBy: { date: "desc" },
      take: 30,
    })

    return NextResponse.json({
      classInfo,
      students,
      attendanceMap,
      summary: summaryMap,
      recentDates: recentDates.map((d) => d.date),
    })
  } catch (error) {
    console.error("GET /teacher/attendance error:", error)
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
    const { class_id, date, records } = body
    // records: [{ student_id, status, note }]

    if (!class_id || !date || !records?.length) {
      return NextResponse.json({ error: "class_id, date and records required" }, { status: 400 })
    }

    // Verify teacher owns this class
    const classTeacher = await prisma.classTeacher.findUnique({
      where: { class_id_teacher_id: { class_id, teacher_id: user.id } },
    })
    if (!classTeacher) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const targetDate = new Date(date)

    // Upsert each attendance record
    const results = await Promise.all(
      records.map((r: { student_id: string; status: string; note?: string }) =>
        prisma.attendance.upsert({
          where: {
            class_id_student_id_date: {
              class_id,
              student_id: r.student_id,
              date: targetDate,
            },
          },
          update: {
            status: r.status as any,
            note: r.note || null,
          },
          create: {
            class_id,
            student_id: r.student_id,
            date: targetDate,
            status: r.status as any,
            note: r.note || null,
          },
        })
      )
    )

    return NextResponse.json({ success: true, count: results.length })
  } catch (error) {
    console.error("POST /teacher/attendance error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}