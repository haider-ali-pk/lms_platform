export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schools = await prisma.school.findMany({
    orderBy: { created_at: "desc" },
    include: {
      _count: { select: { users: true, courses: true } },
      stripe_subscription: { select: { plan: true, status: true } },
    },
  });

  return NextResponse.json({ schools });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, phone, address, city, slug } = body;

  if (!name || !email || !slug) {
    return NextResponse.json({ error: "Name, email and slug are required" }, { status: 400 });
  }

  const existing = await prisma.school.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Slug already taken" }, { status: 400 });

  const school = await prisma.school.create({
    data: { name, email, phone, address, city, slug },
  });

  return NextResponse.json({ school }, { status: 201 });
}