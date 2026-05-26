export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";

export async function PUT(req: NextRequest, context: { params: Promise<{ schoolId: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { schoolId } = await context.params;
  const { plan, status } = await req.json();

  const existing = await prisma.stripeSubscription.findUnique({
    where: { school_id: schoolId },
  });

  if (existing) {
    const updated = await prisma.stripeSubscription.update({
      where: { school_id: schoolId },
      data: { plan, status, updated_at: new Date() },
    });
    return NextResponse.json({ subscription: updated });
  } else {
    const created = await prisma.stripeSubscription.create({
      data: {
        school_id: schoolId,
        stripe_customer_id: `manual_${schoolId}`,
        stripe_subscription_id: `manual_sub_${schoolId}`,
        plan,
        status,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return NextResponse.json({ subscription: created });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ schoolId: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { schoolId } = await context.params;

  await prisma.stripeSubscription.update({
    where: { school_id: schoolId },
    data: { status: "canceled", cancel_at_period_end: true },
  });

  return NextResponse.json({ success: true });
}