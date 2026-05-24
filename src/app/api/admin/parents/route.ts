export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;
  const skip = (page - 1) * limit;

  const where = {
    school_id: user.school_id,
    role: "parent" as const,
    deleted_at: null,
    OR: search
      ? [
          { first_name: { contains: search, mode: "insensitive" as const } },
          { last_name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ]
      : undefined,
  };

  const [parents, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        is_active: true,
        avatar_url: true,
        created_at: true,
        children: {
          select: {
            student: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                is_active: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ parents, total, page, limit });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { first_name, last_name, email, password, phone, is_active } = body;

  if (!first_name || !last_name || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const parent = await prisma.user.create({
    data: {
      first_name,
      last_name,
      email,
      password_hash,
      phone: phone || null,
      is_active: is_active ?? true,
      role: "parent",
      school_id: user.school_id,
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      is_active: true,
      created_at: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      user_id: user.id,
      action: "CREATE_PARENT",
      entity: "User",
      entity_id: parent.id,
      details: `Admin created parent: ${email}`,
    },
  });

  return NextResponse.json({ parent }, { status: 201 });
}