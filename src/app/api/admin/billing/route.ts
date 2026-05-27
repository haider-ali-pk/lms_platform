export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { SCHOOL_PLAN_SEATS, SCHOOL_PLAN_TEACHERS, SCHOOL_PLAN_AMOUNTS, SCHOOL_SPONSORED_AI } from "@/app/lib/stripe";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const school = await prisma.school.findUnique({
    where: { id: user.school_id },
    include: {
      stripe_subscription: true,
      _count: { select: { users: true } },
    },
  });

  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  const studentCount = await prisma.user.count({ where: { school_id: user.school_id, role: "student" } });
  const teacherCount = await prisma.user.count({ where: { school_id: user.school_id, role: "teacher" } });

  const plan = school.stripe_subscription?.plan ?? "trial";
  const seatLimit = SCHOOL_PLAN_SEATS[plan] ?? 30;
  const teacherLimit = SCHOOL_PLAN_TEACHERS[plan] ?? 2;
  const monthlyAmount = SCHOOL_PLAN_AMOUNTS[plan] ?? 0;
  const sponsoredAI = SCHOOL_SPONSORED_AI[plan] ?? "none";

  return NextResponse.json({
    school,
    plan,
    status: school.stripe_subscription?.status ?? "none",
    seatLimit,
    teacherLimit,
    studentCount,
    teacherCount,
    monthlyAmount,
    sponsoredAI,
    currentPeriodEnd: school.stripe_subscription?.current_period_end ?? null,
    cancelAtPeriodEnd: school.stripe_subscription?.cancel_at_period_end ?? false,
    stripeCustomerId: school.stripe_subscription?.stripe_customer_id ?? null,
  });
}