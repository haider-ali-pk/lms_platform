export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const schools = await prisma.school.findMany({
    where: { is_active: true },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ schools });
}