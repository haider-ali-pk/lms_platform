export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { getUserFromRequest } from "@/app/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const schoolFilter = searchParams.get("school_id") || ""

    const [totalCourses, totalEnrollments, publishedCourses] = await Promise.all([
      prisma.course.count({ where: { deleted_at: null } }),
      prisma.enrollment.count(),
      prisma.course.count({ where: { deleted_at: null, is_published: true } }),
    ])

    const topCourses = await prisma.course.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        title: true,
        subject: true,
        is_published: true,
        school: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { enrollments: { _count: "desc" } },
      take: 10,
    })

    const coursesWhere = schoolFilter
      ? { deleted_at: null as null, school_id: schoolFilter }
      : { deleted_at: null as null }

    const allCourses = await prisma.course.findMany({
      where: coursesWhere,
      select: {
        id: true,
        title: true,
        subject: true,
        grade_level: true,
        is_published: true,
        created_at: true,
        school: { select: { id: true, name: true } },
        _count: { select: { enrollments: true, lessons: true } },
      },
      orderBy: { created_at: "desc" },
    })

    const schools = await prisma.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({
      kpi: {
        totalCourses,
        totalEnrollments,
        publishedCourses,
        draftCourses: totalCourses - publishedCourses,
      },
      topCourses: topCourses.map((c) => ({
        id:           c.id,
        title:        c.title,
        subject:      c.subject,
        school:       c.school.name,
        enrollments:  c._count.enrollments,
        is_published: c.is_published,
      })),
      courses: allCourses.map((c) => ({
        id:           c.id,
        title:        c.title,
        subject:      c.subject,
        grade_level:  c.grade_level,
        is_published: c.is_published,
        created_at:   c.created_at,
        school_id:    c.school.id,
        school:       c.school.name,
        enrollments:  c._count.enrollments,
        lessons:      c._count.lessons,
      })),
      schools,
    })
  } catch (error) {
    console.error("GET /super-admin/courses error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}