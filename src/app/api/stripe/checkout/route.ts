export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { stripe, SCHOOL_PLAN_PRICES } from "@/app/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { schoolId, plan } = await req.json();
  const targetSchoolId = schoolId ?? user.school_id;

  const school = await prisma.school.findUnique({ where: { id: targetSchoolId } });
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  const priceId = SCHOOL_PLAN_PRICES[plan];
  if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const existing = await prisma.stripeSubscription.findUnique({ where: { school_id: targetSchoolId } });

  let customerId: string;
  if (existing?.stripe_customer_id && !existing.stripe_customer_id.startsWith("manual_")) {
    customerId = existing.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      name: school.name,
      email: school.email ?? undefined,
      metadata: { school_id: targetSchoolId, type: "school" },
    });
    customerId = customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const returnPath = user.role === "super_admin" ? "/super-admin/billing" : "/admin/billing";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}${returnPath}?success=1`,
    cancel_url: `${appUrl}${returnPath}?canceled=1`,
    metadata: { school_id: targetSchoolId, plan, type: "school" },
    subscription_data: { metadata: { school_id: targetSchoolId, plan, type: "school" } },
  });

  return NextResponse.json({ url: session.url });
}