export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";
import { verifyTOTPCode } from "@/app/lib/totp";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.two_fa_enabled || !dbUser?.two_fa_secret) {
      return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
    }

    const valid = verifyTOTPCode(dbUser.two_fa_secret, code);
    if (!valid) {
      return NextResponse.json({ error: "Invalid code. Try again." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { two_fa_enabled: false, two_fa_secret: null },
    });

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: "2FA_DISABLED",
        entity: "User",
        meta: { email: dbUser.email },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("2FA DISABLE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}