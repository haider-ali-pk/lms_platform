export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

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

  const PLAN_AMOUNTS: Record<string, number> = {
    starter: 49,
    growth: 99,
    enterprise: 199,
  };

  const mrr = schools.reduce((sum, s) => {
    if (!s.stripe_subscription || s.stripe_subscription.status !== "active") return sum;
    return sum + (PLAN_AMOUNTS[s.stripe_subscription.plan] ?? 0);
  }, 0);

  const activeCount = schools.filter((s) => s.stripe_subscription?.status === "active").length;
  const pastDueCount = schools.filter((s) => s.stripe_subscription?.status === "past_due").length;
  const noplanCount = schools.filter((s) => !s.stripe_subscription).length;

  return NextResponse.json({ schools, mrr, activeCount, pastDueCount, noplanCount });
}