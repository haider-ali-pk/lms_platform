export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const session = await prisma.aiChatSession.findFirst({
    where: { id, user_id: user.id },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.aiChatMessage.findMany({
    where: { session_id: id },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json({ session, messages });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  await prisma.aiChatSession.delete({ where: { id, user_id: user.id } });
  return NextResponse.json({ ok: true });
}
