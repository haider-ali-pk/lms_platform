export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyTOTPCode } from "@/app/lib/totp";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "secret");

export async function POST(req: NextRequest) {
  try {
    const { userId, code } = await req.json();
    if (!userId || !code) {
      return NextResponse.json({ error: "userId and code required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.two_fa_secret) {
      return NextResponse.json({ error: "2FA not set up" }, { status: 400 });
    }

    const valid = verifyTOTPCode(user.two_fa_secret, code);
    if (!valid) {
      return NextResponse.json({ error: "Invalid code. Try again." }, { status: 400 });
    }

    const token = await new SignJWT({
      id: user.id,
      role: user.role,
      school_id: user.school_id,
      is_active: user.is_active,
      fee_blocked: (user as any).fee_blocked ?? false,
      last_password_change: user.last_password_change?.toISOString() ?? new Date().toISOString(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(SECRET);

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: "2FA_LOGIN",
        entity: "User",
        meta: { email: user.email },
      },
    });

    const response = NextResponse.json({ success: true, role: user.role });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("2FA VERIFY ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}