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
    const user = await getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [totalEnrollments, activeSubscriptions, allSubscriptions] = await Promise.all([
      prisma.enrollment.count(),
      prisma.stripeSubscription.count({ where: { status: "active" } }),
      prisma.stripeSubscription.findMany({
        where: { status: { in: ["active", "trialing"] } },
        select: { plan: true, school_id: true },
      }),
    ])

    const monthlyRevenue     = allSubscriptions.reduce((sum, sub) => sum + (PLAN_PRICES[sub.plan] || 0), 0)
    const enrollmentRevenue  = totalEnrollments * 10

    const planBreakdown: Record<string, number> = {}
    for (const sub of allSubscriptions) {
      planBreakdown[sub.plan] = (planBreakdown[sub.plan] || 0) + 1
    }

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        stripe_subscription: {
          select: {
            plan: true,
            status: true,
            current_period_start: true,
            current_period_end: true,
            cancel_at_period_end: true,
            created_at: true,
          },
        },
        _count: { select: { courses: true } },
        courses: {
          select: {
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    const revenuePerSchool = schools.map((s) => {
      const enrollments = s.courses.reduce((sum, c) => sum + c._count.enrollments, 0)
      return {
        school_id:            s.id,
        name:                 s.name,
        plan:                 s.stripe_subscription?.plan    || "none",
        status:               s.stripe_subscription?.status  || "none",
        revenue:              PLAN_PRICES[s.stripe_subscription?.plan || ""] || 0,
        courses:              s._count.courses,
        enrollments,
        current_period_start: s.stripe_subscription?.current_period_start || null,
        current_period_end:   s.stripe_subscription?.current_period_end   || null,
        cancel_at_period_end: s.stripe_subscription?.cancel_at_period_end ?? false,
        created_at:           s.stripe_subscription?.created_at           || null,
      }
    })

    return NextResponse.json({
      kpi: {
        totalEnrollments,
        activeSubscriptions,
        monthlyRevenue,
        enrollmentRevenue,
        combinedRevenue: monthlyRevenue + enrollmentRevenue,
      },
      planBreakdown,
      revenuePerSchool,
    })
  } catch (error) {
    console.error("GET /super-admin/revenue error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}