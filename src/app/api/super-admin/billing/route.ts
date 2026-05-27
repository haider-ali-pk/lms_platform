export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { SCHOOL_PLAN_AMOUNTS, STUDENT_PLAN_LIMITS } from "@/app/lib/stripe";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
    include: {
      stripe_subscription: true,
      _count: { select: { users: true } },
    },
  });

  const studentSubs = await prisma.studentSubscription.findMany({
    where: { status: "active", plan: { not: "free" } },
  });

  const STUDENT_PRICES: Record<string, number> = { basic: 9, pro: 19, booster: 4.99 };

  const schoolMRR = schools.reduce((sum, s) => {
    if (!s.stripe_subscription || s.stripe_subscription.status !== "active") return sum;
    return sum + (SCHOOL_PLAN_AMOUNTS[s.stripe_subscription.plan] ?? 0);
  }, 0);

  const studentMRR = studentSubs.reduce((sum, s) => {
    if (s.plan === "booster") return sum;
    return sum + (STUDENT_PRICES[s.plan] ?? 0);
  }, 0);

  const totalMRR = schoolMRR + studentMRR;
  const activeSchools = schools.filter((s) => s.stripe_subscription?.status === "active").length;
  const pastDueCount = schools.filter((s) => s.stripe_subscription?.status === "past_due").length;
  const noplanCount = schools.filter((s) => !s.stripe_subscription).length;
  const paidStudents = studentSubs.length;

  return NextResponse.json({
    schools,
    schoolMRR,
    studentMRR,
    totalMRR,
    activeSchools,
    pastDueCount,
    noplanCount,
    paidStudents,
  });
}