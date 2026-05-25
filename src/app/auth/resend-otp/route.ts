export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { createAndSendOTP, checkResendLimit } from "@/app/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const allowed = await checkResendLimit(userId);
    if (!allowed) {
      return NextResponse.json({ error: "Max resend attempts reached. Try again in 1 hour." }, { status: 429 });
    }

    await createAndSendOTP(userId, user.email);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}