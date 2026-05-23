// src/app/api/super-admin/users/route.ts
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

// GET — list all users across all schools with pagination
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const role = searchParams.get("role") ?? undefined;
  const school_id = searchParams.get("school_id") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const skip = (page - 1) * limit;

  const where: any = {
    deleted_at: null,
    ...(role && { role: role as any }),
    ...(school_id && { school_id }),
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
        is_verified: true,
        created_at: true,
        school: { select: { id: true, name: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, limit, pages: Math.ceil(total / limit) });
}

// POST — create new user
export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { first_name, last_name, email, password, role, school_id } = body;

  if (!first_name || !last_name || !email || !password || !role) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 });

  const password_hash = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      first_name,
      last_name,
      email,
      password_hash,
      role,
      school_id: school_id || null,
      is_verified: true,
    },
  });

  return NextResponse.json({ user: newUser }, { status: 201 });
}