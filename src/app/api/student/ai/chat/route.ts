export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check usage limits
    let sub = await prisma.studentSubscription.findUnique({ where: { student_id: user.id } });

    if (!sub) {
      const resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      sub = await prisma.studentSubscription.create({
        data: {
          student_id: user.id,
          stripe_customer_id: `free_${user.id}`,
          plan: "free",
          status: "active",
          messages_used: 0,
          messages_limit: 10,
          period_reset_at: resetDate,
        },
      });
    }

    // Reset if period expired
    if (new Date() > new Date(sub.period_reset_at)) {
      const resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      sub = await prisma.studentSubscription.update({
        where: { student_id: user.id },
        data: { messages_used: 0, period_reset_at: resetDate },
      });
    }

    // Check limit
    if (sub.messages_used >= sub.messages_limit) {
      return NextResponse.json({
        error: `You've used all ${sub.messages_limit} AI messages this month. Upgrade your plan to continue.`,
        limitReached: true,
        plan: sub.plan,
      }, { status: 429 });
    }

    const { message, session_id, subject, history, mode } = await req.json();

    const isHomeworkHelper = mode === "homework";

    const systemPrompt = `You are an incredibly knowledgeable AI assistant. You have expertise in EVERYTHING — every academic subject, every sport, every movie, every TV show, every game, every hobby, music, art, history, science, technology, programming, cooking, travel, finance, health, philosophy, religion, politics, pop culture, and anything else a person could ask about.

You are friendly, engaging, and adapt your tone to match what the person is asking — casual for fun topics, detailed for academic questions.

${isHomeworkHelper ? `HOMEWORK HELPER MODE: The student needs help with homework. NEVER give direct answers. Instead:
1. Understand what they're struggling with
2. Explain the concept or method step by step
3. Give a similar example (not their exact question)
4. Guide them to solve it themselves
5. Check their understanding` : ""}

${subject && subject !== "general" ? `Current context: ${subject}` : ""}

Guidelines:
- Answer EVERY question fully — no topic is off limits
- Use markdown for structure when helpful
- Be engaging and human, not robotic
- For academic topics: be thorough and educational
- For fun topics (movies, sports, etc): be enthusiastic and conversational
- Never say "I can't help with that" — you can help with everything`;

    const groqMessages = [
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...groqMessages],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const reply = completion.choices[0].message.content || "";

    // Increment usage
    await prisma.studentSubscription.update({
      where: { student_id: user.id },
      data: { messages_used: { increment: 1 } },
    });

    let sessionId = session_id;
    if (!sessionId) {
      const title = message.length > 50 ? message.slice(0, 50) + "…" : message;
      const session = await prisma.aiChatSession.create({
        data: { user_id: user.id, title, subject: subject || "general" },
      });
      sessionId = session.id;
    } else {
      await prisma.aiChatSession.update({
        where: { id: sessionId },
        data: { updated_at: new Date() },
      });
    }

    await prisma.aiChatMessage.createMany({
      data: [
        { session_id: sessionId, role: "user", content: message },
        { session_id: sessionId, role: "assistant", content: reply },
      ],
    });

    return NextResponse.json({
      reply,
      session_id: sessionId,
      messagesUsed: sub.messages_used + 1,
      messagesLimit: sub.messages_limit,
    });
  } catch (error: any) {
    console.error("AI Chat error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}