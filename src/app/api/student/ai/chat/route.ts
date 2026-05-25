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

    const { message, session_id, subject, history } = await req.json();

    const subjectCtx = subject && subject !== "general"
      ? `The student is currently studying ${subject}. Lean toward ${subject}-related context when relevant, but answer any question fully.`
      : "";

    const systemPrompt = `You are an expert AI Tutor assistant for students. You have comprehensive knowledge across ALL subjects and domains — mathematics, sciences, history, literature, programming, arts, philosophy, medicine, law, economics, and everything else.

${subjectCtx}

Guidelines:
- Give thorough, accurate, well-structured answers tailored to a student's level
- Use markdown formatting: headers, bullet points, code blocks, bold text
- For math/science: show step-by-step working with clear explanations
- For coding: provide complete, runnable code examples with comments
- For essays/writing: give structure, examples, and tips
- Break down complex concepts into simple, digestible explanations
- Be encouraging, patient, and supportive
- Use analogies and real-world examples to make concepts stick
- Never refuse a legitimate educational question`;

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

    return NextResponse.json({ reply, session_id: sessionId });
  } catch (error: any) {
    console.error("AI Chat error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}