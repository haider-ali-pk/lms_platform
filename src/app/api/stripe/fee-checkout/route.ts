export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { stripe } from "@/app/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fee_id } = await req.json();

  const fee = await prisma.feePayment.findUnique({
    where: { id: fee_id },
    include: { school: true },
  });

  if (!fee) return NextResponse.json({ error: "Fee not found" }, { status: 404 });
  if (fee.student_id !== user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (fee.status === "paid") return NextResponse.json({ error: "Already paid" }, { status: 400 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: `School Fee — ${fee.school.name}`,
          description: fee.notes ?? `Due: ${new Date(fee.due_date).toLocaleDateString()}`,
        },
        unit_amount: Math.round(fee.amount * 100),
      },
      quantity: 1,
    }],
    customer_email: dbUser.email,
    success_url: `${appUrl}/student/fees?success=1&fee_id=${fee_id}`,
    cancel_url: `${appUrl}/student/fees?canceled=1`,
    metadata: { fee_id, student_id: user.id, type: "fee_payment" },
  });

  await prisma.feePayment.update({
    where: { id: fee_id },
    data: { stripe_session_id: session.id },
  });

  return NextResponse.json({ url: session.url });
}