export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "secret");

export async function POST(req: NextRequest) {
  try {
    const { userId, currentPassword, newPassword } = await req.json();

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: `User not found: ${userId}` }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    console.log("COMPARE RESULT:", valid, "userId:", userId);

    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: "Password does not meet requirements" }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    const now = new Date();

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hash, last_password_change: now },
    });

    console.log("UPDATED last_password_change:", updated.last_password_change);

    // ── ISSUE FRESH JWT WITH NEW last_password_change ──
    const token = await new SignJWT({
      id: user.id,
      role: user.role,
      school_id: user.school_id,
      is_active: user.is_active,
      fee_blocked: (user as any).fee_blocked ?? false,
      last_password_change: now.toISOString(), // ← fresh date
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(SECRET);

    const res = NextResponse.json({ success: true });

    // ── SET FRESH COOKIE ──
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (e: any) {
    console.error("CHANGE PASSWORD ERROR:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}