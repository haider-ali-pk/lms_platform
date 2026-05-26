export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {
    deleted_at: null,
    ...(search && {
      OR: [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        is_active: true,
        school_id: true,
        created_at: true,
        school: { select: { id: true, name: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { first_name, last_name, email, role, school_id, is_active, password } = body;

  if (!first_name || !last_name || !email || !password || !role) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already in use." }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const created = await prisma.user.create({
    data: {
      first_name,
      last_name,
      email,
      role,
      is_active: is_active ?? true,
      school_id: school_id || null,
      password_hash,
      last_password_change: new Date(),
    },
  });

  return NextResponse.json({ user: created }, { status: 201 });
}