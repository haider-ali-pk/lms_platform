export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";
import { generateTOTPSecret, generateQRCode } from "@/app/lib/totp";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (dbUser.two_fa_enabled) {
      return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
    }

    const { secret, otpauthUrl } = generateTOTPSecret(dbUser.email);
    const qrCode = await generateQRCode(otpauthUrl);

    // Store secret temporarily (not enabled yet until verified)
    await prisma.user.update({
      where: { id: user.id },
      data: { two_fa_secret: secret },
    });

    return NextResponse.json({ qrCode, secret });
  } catch (err) {
    console.error("2FA SETUP ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}