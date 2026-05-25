export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyOTP } from "@/app/lib/otp";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "secret";

export async function POST(req: NextRequest) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const valid = await verifyOTP(userId, code);
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Issue final JWT
    const token = jwt.sign(
  {
    id: user.id,
    role: user.role,
    school_id: user.school_id,
    is_active: user.is_active,
    last_password_change: user.last_password_change,
  },
  SECRET,
  { expiresIn: "7d" }
);

    const res = NextResponse.json({ success: true, role: user.role });
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}