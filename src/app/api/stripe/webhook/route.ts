export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { prisma } from "@/app/lib/prisma";
import { SCHOOL_SPONSORED_AI, STUDENT_PLAN_LIMITS } from "@/app/lib/stripe";
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

  // ─── SCHOOL subscription ───────────────────────────────────────────
  async function upsertSchoolSubscription(sub: Stripe.Subscription) {
    const schoolId = sub.metadata?.school_id;
    if (!schoolId) return;

    const plan = (sub.metadata?.plan ?? "trial") as string;
    const item = sub.items.data[0];
    const periodStart = new Date(item.current_period_start * 1000);
    const periodEnd = new Date(item.current_period_end * 1000);
    const status = sub.status as string;

    const existing = await prisma.stripeSubscription.findUnique({ where: { school_id: schoolId } });

    if (existing) {
      await prisma.stripeSubscription.update({
        where: { school_id: schoolId },
        data: {
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer as string,
          plan: plan as any,
          status: status as any,
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
          status: status as any,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: sub.cancel_at_period_end,
        },
      });
    }

    if (status === "active") {
      await prisma.user.updateMany({ where: { school_id: schoolId }, data: { is_active: true } });

      // Upgrade sponsored AI for all students in this school
      const sponsoredAI = SCHOOL_SPONSORED_AI[plan] ?? "none";
      if (sponsoredAI !== "none") {
        const students = await prisma.user.findMany({ where: { school_id: schoolId, role: "student" } });
        for (const student of students) {
          const existingSub = await prisma.studentSubscription.findUnique({ where: { student_id: student.id } });
          const limit = STUDENT_PLAN_LIMITS[sponsoredAI] ?? 10;
          if (!existingSub) {
            await prisma.studentSubscription.create({
              data: {
                student_id: student.id,
                stripe_customer_id: `sponsored_${student.id}`,
                plan: sponsoredAI,
                status: "active",
                messages_used: 0,
                messages_limit: limit,
                period_reset_at: periodEnd,
              },
            });
          } else if (existingSub.plan === "free" || existingSub.plan === "none") {
            await prisma.studentSubscription.update({
              where: { student_id: student.id },
              data: { plan: sponsoredAI, messages_limit: limit, period_reset_at: periodEnd },
            });
          }
        }
      }
    }

    if (status === "canceled" || status === "unpaid") {
      await prisma.user.updateMany({
        where: { school_id: schoolId, role: { not: "super_admin" } },
        data: { is_active: false },
      });
    }
  }

  // ─── STUDENT subscription ──────────────────────────────────────────
  async function upsertStudentSubscription(sub: Stripe.Subscription) {
    const studentId = sub.metadata?.student_id;
    if (!studentId) return;

    const plan = (sub.metadata?.plan ?? "free") as string;
    const item = sub.items.data[0];
    const periodEnd = new Date(item.current_period_end * 1000);
    const status = sub.status as string;
    const limit = STUDENT_PLAN_LIMITS[plan] ?? 10;

    const existing = await prisma.studentSubscription.findUnique({ where: { student_id: studentId } });

    if (existing) {
      await prisma.studentSubscription.update({
        where: { student_id: studentId },
        data: {
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer as string,
          plan,
          status,
          messages_limit: limit,
          current_period_end: periodEnd,
          period_reset_at: periodEnd,
        },
      });
    } else {
      await prisma.studentSubscription.create({
        data: {
          student_id: studentId,
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer as string,
          plan,
          status,
          messages_used: 0,
          messages_limit: limit,
          current_period_end: periodEnd,
          period_reset_at: periodEnd,
        },
      });
    }
  }

  // ─── Event router ──────────────────────────────────────────────────
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      if (sub.metadata?.type === "student") await upsertStudentSubscription(sub);
      else await upsertSchoolSubscription(sub);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      if (sub.metadata?.type === "student") {
        const studentId = sub.metadata?.student_id;
        if (studentId) {
          await prisma.studentSubscription.updateMany({
            where: { student_id: studentId },
            data: { plan: "free", status: "canceled", messages_limit: 10 },
          });
        }
      } else {
        const schoolId = sub.metadata?.school_id;
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
      }
      break;
    }

    // ─── Single, unified checkout.session.completed handler ───────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Handle fee payment
      if (session.metadata?.type === "fee_payment") {
        const feeId = session.metadata.fee_id;
        const studentId = session.metadata.student_id;
        if (feeId) {
          await prisma.feePayment.update({
            where: { id: feeId },
            data: { status: "paid", paid_at: new Date(), stripe_session_id: session.id },
          });
          if (studentId) {
            await prisma.user.update({
              where: { id: studentId },
              data: { is_active: true },
            });
          }
        }
        break;
      }

      // Handle booster one-time payment
      if (session.metadata?.type === "student" && session.metadata?.plan === "booster") {
        const studentId = session.metadata.student_id;
        if (studentId) {
          const existing = await prisma.studentSubscription.findUnique({ where: { student_id: studentId } });
          const boosterExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          if (existing) {
            await prisma.studentSubscription.update({
              where: { student_id: studentId },
              data: { messages_limit: existing.messages_limit + 500, period_reset_at: boosterExpiry },
            });
          } else {
            await prisma.studentSubscription.create({
              data: {
                student_id: studentId,
                stripe_customer_id: (session.customer as string) ?? `manual_${studentId}`,
                plan: "booster",
                status: "active",
                messages_used: 0,
                messages_limit: 500,
                period_reset_at: boosterExpiry,
              },
            });
          }
        }
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as any;
      const subId = invoice.subscription as string | null;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        if (sub.metadata?.type === "student") await upsertStudentSubscription(sub);
        else await upsertSchoolSubscription(sub);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      const subId = invoice.subscription as string | null;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        if (sub.metadata?.type === "school") {
          const schoolId = sub.metadata?.school_id;
          if (schoolId) {
            await prisma.stripeSubscription.updateMany({
              where: { school_id: schoolId },
              data: { status: "past_due" as any },
            });
          }
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}