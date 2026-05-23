// src/app/api/super-admin/users/[id]/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const JWT_SECRET = process.env.JWT_SECRET!;
    return jwt.verify(auth.slice(7), JWT_SECRET) as { id: string; role: string };
  } catch {
    return null;
  }
}

// PUT — update user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { first_name, last_name, email, role, school_id, is_active, password } = body;

  const data: any = { first_name, last_name, email, role, is_active,
    school_id: school_id || null,
  };

  if (password) {
    data.password_hash = await bcrypt.hash(password, 12);
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ user: updated });
}

// DELETE — soft delete user
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.user.update({
    where: { id: params.id },
    data: { deleted_at: new Date(), is_active: false },
  });

  return NextResponse.json({ success: true });
}