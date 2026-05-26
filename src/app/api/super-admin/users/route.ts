export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const { first_name, last_name, email, role, school_id, is_active, password } = body;

  const data: any = {
    first_name,
    last_name,
    email,
    role,
    is_active,
    school_id: school_id || null,
  };

  if (password) {
    data.password_hash = await bcrypt.hash(password, 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  await prisma.user.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
  });

  return NextResponse.json({ success: true });
}