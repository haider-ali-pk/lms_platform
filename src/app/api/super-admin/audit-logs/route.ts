// src/app/api/super-admin/audit-logs/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const JWT_SECRET = process.env.JWT_SECRET!;
    return jwt.verify(auth.slice(7), JWT_SECRET) as { id: string; role: string };
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const search = searchParams.get("search") ?? undefined;
  const school_id = searchParams.get("school_id") ?? undefined;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(school_id && { school_id }),
    ...(search && {
      OR: [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        user: { select: { first_name: true, last_name: true, email: true, role: true } },
        school: { select: { name: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
}