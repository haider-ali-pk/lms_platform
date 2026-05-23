export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { getUserFromRequest } from "@/app/lib/auth"

const PLAN_PRICES: Record<string, number> = {
  starter:    200,
  growth:     350,
  enterprise: 500,
}

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const schoolFilter = searchParams.get("school_id") || ""

    // ── KPI Data ──────────────────────────────────────────
    const [
      totalCourses,
      totalEnrollments,
      activeSubscriptions,
      allSubscriptions,
    ] = await Promise.all([
      prisma.course.count({ where: { deleted_at: null } }),
      prisma.enrollment.count(),
      prisma.stripeSubscription.count({ where: { status: "active" } }),
      prisma.stripeSubscription.findMany({
        where: { status: { in: ["active", "trialing"] } },
        select: { plan: true, school_id: true }
      }),
    ])

    // Monthly revenue from Stripe plans
    const monthlyRevenue = allSubscriptions.reduce((sum, sub) => {
      return sum + (PLAN_PRICES[sub.plan] || 0)
    }, 0)

    // ── Revenue per school (Stripe) ───────────────────────
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        stripe_subscription: {
          select: { plan: true, status: true }
        },
        _count: {
          select: { courses: true }
        }
      },
      orderBy: { name: "asc" }
    })

    const revenuePerSchool = schools.map((s) => ({
      school_id:  s.id,
      name:       s.name,
      plan:       s.stripe_subscription?.plan || "none",
      status:     s.stripe_subscription?.status || "none",
      revenue:    PLAN_PRICES[s.stripe_subscription?.plan || ""] || 0,
      courses:    s._count.courses,
    }))

    // ── Top 10 most enrolled courses ─────────────────────
    const topCourses = await prisma.course.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        title: true,
        subject: true,
        is_published: true,
        school: { select: { name: true } },
        _count: { select: { enrollments: true } }
      },
      orderBy: { enrollments: { _count: "desc" } },
      take: 10,
    })

    // ── All courses (filterable) ──────────────────────────
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
        _count: { select: { enrollments: true, lessons: true } }
      },
      orderBy: { created_at: "desc" },
    })

    // ── Enrollment revenue estimate ───────────────────────
    // Each enrollment = $10 one-time (flat estimate for display)
    const enrollmentRevenue = totalEnrollments * 10

    return NextResponse.json({
      kpi: {
        totalCourses,
        totalEnrollments,
        activeSubscriptions,
        monthlyRevenue,
        enrollmentRevenue,
        combinedRevenue: monthlyRevenue + enrollmentRevenue,
      },
      revenuePerSchool,
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
      schools: schools.map((s) => ({ id: s.id, name: s.name })),
    })

  } catch (error) {
    console.error("GET /courses-revenue error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}