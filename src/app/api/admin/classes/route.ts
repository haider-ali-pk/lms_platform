export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";

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
    school_id: user.school_id!,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { grade: { contains: search, mode: "insensitive" as const } },
            { section: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [classes, total] = await Promise.all([
    prisma.class.findMany({
      where,
      select: {
        id: true,
        name: true,
        grade: true,
        section: true,
        academic_year: true,
        created_at: true,
        teachers: {
          select: {
            id: true,
            teacher: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: { attendance: true },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.class.count({ where }),
  ]);

  return NextResponse.json({ classes, total, page, limit });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, grade, section, academic_year } = body;

  if (!name) {
    return NextResponse.json({ error: "Class name is required." }, { status: 400 });
  }

  const newClass = await prisma.class.create({
    data: {
      school_id: user.school_id!,
      name,
      grade: grade || null,
      section: section || null,
      academic_year: academic_year || null,
    },
  });

  return NextResponse.json({ class: newClass }, { status: 201 });
}