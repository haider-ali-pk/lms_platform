export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.aiChatSession.findMany({
    where: { user_id: user.id },
    include: { _count: { select: { messages: true } } },
    orderBy: { updated_at: "desc" },
    take: 50,
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, subject } = await req.json();

  const session = await prisma.aiChatSession.create({
    data: { user_id: user.id, title: title || "New Conversation", subject },
  });

  return NextResponse.json({ session });
}

