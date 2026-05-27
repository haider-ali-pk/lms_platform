export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { stripe, STUDENT_PLAN_PRICES, STUDENT_PLAN_LIMITS } from "@/app/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json();
  const priceId = STUDENT_PLAN_PRICES[plan];
  if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const existing = await prisma.studentSubscription.findUnique({ where: { student_id: user.id } });

  let customerId: string;
  if (existing?.stripe_customer_id && !existing.stripe_customer_id.startsWith("manual_") && !existing.stripe_customer_id.startsWith("free_") && !existing.stripe_customer_id.startsWith("sponsored_")) {
    customerId = existing.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      name: `${dbUser.first_name} ${dbUser.last_name}`,
      email: dbUser.email,
      metadata: { student_id: user.id, type: "student" },
    });
    customerId = customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const isOneTime = plan === "booster";

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isOneTime ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/student/billing?success=1`,
      cancel_url: `${appUrl}/student/billing?canceled=1`,
      metadata: { student_id: user.id, plan, type: "student" },
      ...(isOneTime ? {} : {
        subscription_data: { metadata: { student_id: user.id, plan, type: "student" } },
      }),
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? "Stripe error" }, { status: 400 });
  }
}