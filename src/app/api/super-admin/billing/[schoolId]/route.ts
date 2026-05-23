// src/app/api/super-admin/billing/[schoolId]/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const JWT_SECRET = process.env.JWT_SECRET!;
    return jwt.verify(auth.slice(7), JWT_SECRET) as { id: string; role: string };
  } catch { return null; }
}

// PUT — assign or update plan for a school
export async function PUT(req: NextRequest, { params }: { params: { schoolId: string } }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { plan, status } = await req.json();

  const existing = await prisma.stripeSubscription.findUnique({
    where: { school_id: params.schoolId },
  });

  if (existing) {
    const updated = await prisma.stripeSubscription.update({
      where: { school_id: params.schoolId },
      data: {
        plan,
        status,
        updated_at: new Date(),
      },
    });
    return NextResponse.json({ subscription: updated });
  } else {
    // Create a manual subscription (no Stripe, assigned by super admin)
    const created = await prisma.stripeSubscription.create({
      data: {
        school_id: params.schoolId,
        stripe_customer_id: `manual_${params.schoolId}`,
        stripe_subscription_id: `manual_sub_${params.schoolId}`,
        plan,
        status,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return NextResponse.json({ subscription: created });
  }
}

// DELETE — cancel a school's subscription
export async function DELETE(req: NextRequest, { params }: { params: { schoolId: string } }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.stripeSubscription.update({
    where: { school_id: params.schoolId },
    data: { status: "canceled", cancel_at_period_end: true },
  });

  return NextResponse.json({ success: true });
}