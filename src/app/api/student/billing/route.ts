export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { STUDENT_PLAN_LIMITS } from "@/app/lib/stripe";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sub = await prisma.studentSubscription.findUnique({ where: { student_id: user.id } });

  // Auto-create free subscription if none exists
  if (!sub) {
    const resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    sub = await prisma.studentSubscription.create({
      data: {
        student_id: user.id,
        stripe_customer_id: `free_${user.id}`,
        plan: "free",
        status: "active",
        messages_used: 0,
        messages_limit: 10,
        period_reset_at: resetDate,
      },
    });
  }

  // Reset usage if period expired
  if (new Date() > new Date(sub.period_reset_at)) {
    const resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    sub = await prisma.studentSubscription.update({
      where: { student_id: user.id },
      data: { messages_used: 0, period_reset_at: resetDate },
    });
  }

  return NextResponse.json({
    plan: sub.plan,
    status: sub.status,
    messagesUsed: sub.messages_used,
    messagesLimit: sub.messages_limit,
    periodResetAt: sub.period_reset_at,
    currentPeriodEnd: sub.current_period_end,
    stripeCustomerId: sub.stripe_customer_id,
  });
}