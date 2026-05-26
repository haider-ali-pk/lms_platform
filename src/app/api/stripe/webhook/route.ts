export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { prisma } from "@/app/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  async function upsertSubscription(sub: Stripe.Subscription) {
    const schoolId = sub.metadata?.school_id;
    if (!schoolId) return;

    const plan = (sub.metadata?.plan ?? "starter") as string;
    const item = sub.items.data[0];
    const periodStart = new Date(item.current_period_start * 1000);
    const periodEnd = new Date(item.current_period_end * 1000);
    const stripeStatus = sub.status as string;

    const existing = await prisma.stripeSubscription.findUnique({ where: { school_id: schoolId } });

    if (existing) {
      await prisma.stripeSubscription.update({
        where: { school_id: schoolId },
        data: {
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer as string,
          plan: plan as any,
          status: stripeStatus as any,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: sub.cancel_at_period_end,
        },
      });
    } else {
      await prisma.stripeSubscription.create({
        data: {
          school_id: schoolId,
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer as string,
          plan: plan as any,
          status: stripeStatus as any,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: sub.cancel_at_period_end,
        },
      });
    }

    if (stripeStatus === "canceled" || stripeStatus === "unpaid") {
      await prisma.user.updateMany({
        where: { school_id: schoolId, role: { not: "super_admin" } },
        data: { is_active: false },
      });
    }

    if (stripeStatus === "active") {
      await prisma.user.updateMany({
        where: { school_id: schoolId },
        data: { is_active: true },
      });
    }
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted": {
      const deletedSub = event.data.object as Stripe.Subscription;
      const schoolId = deletedSub.metadata?.school_id;
      if (schoolId) {
        await prisma.stripeSubscription.updateMany({
          where: { school_id: schoolId },
          data: { status: "canceled" as any, cancel_at_period_end: true },
        });
        await prisma.user.updateMany({
          where: { school_id: schoolId, role: { not: "super_admin" } },
          data: { is_active: false },
        });
      }
      break;
    }

    case "invoice.paid": {
      const paidInvoice = event.data.object as any;
      const paidSubId = paidInvoice.subscription as string | null;
      if (paidSubId) {
        const sub = await stripe.subscriptions.retrieve(paidSubId);
        await upsertSubscription(sub);
      }
      break;
    }

    case "invoice.payment_failed": {
      const failedInvoice = event.data.object as any;
      const failedSubId = failedInvoice.subscription as string | null;
      if (failedSubId) {
        const failedSub = await stripe.subscriptions.retrieve(failedSubId);
        const fSchoolId = failedSub.metadata?.school_id;
        if (fSchoolId) {
          await prisma.stripeSubscription.updateMany({
            where: { school_id: fSchoolId },
            data: { status: "past_due" as any },
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}