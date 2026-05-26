export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { stripe } from "@/app/lib/stripe";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { plan, status } = await req.json();

  const existing = await prisma.stripeSubscription.findUnique({
    where: { school_id: id },
  });

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (existing) {
    await prisma.stripeSubscription.update({
      where: { school_id: id },
      data: {
        plan,
        status,
        current_period_start: now,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
      },
    });
  } else {
    await prisma.stripeSubscription.create({
      data: {
        school_id: id,
        stripe_customer_id: `manual_${id}`,
        stripe_subscription_id: `manual_sub_${id}_${Date.now()}`,
        plan,
        status,
        current_period_start: now,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
      },
    });
  }

  // If status is active, unblock all users in this school
  if (status === "active") {
    await prisma.user.updateMany({
      where: { school_id: id },
      data: { is_active: true },
    });
  }

  // If canceled or unpaid, optionally downgrade
  if (status === "canceled" || status === "unpaid") {
    await prisma.user.updateMany({
      where: { school_id: id, role: { not: "super_admin" } },
      data: { is_active: false },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await prisma.stripeSubscription.findUnique({
    where: { school_id: id },
  });

  if (!existing) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  // If real Stripe subscription, cancel it
  if (existing.stripe_subscription_id && !existing.stripe_subscription_id.startsWith("manual_")) {
    try {
      await stripe.subscriptions.update(existing.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    } catch {}
  }

  await prisma.stripeSubscription.update({
    where: { school_id: id },
    data: {
      status: "canceled",
      cancel_at_period_end: true,
    },
  });

  return NextResponse.json({ success: true });
}