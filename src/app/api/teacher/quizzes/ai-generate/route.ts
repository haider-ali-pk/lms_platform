export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic, count = 5 } = await req.json();
  if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 });

  const prompt = `Generate ${count} multiple-choice quiz questions about: "${topic}".

Return ONLY valid JSON — no markdown, no explanation, no code blocks.

Format:
{
  "questions": [
    {
      "question_text": "Question here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Brief explanation of why this is correct."
    }
  ]
}

Rules:
- correct_index is 0-3 (index into options array)
- All 4 options must be plausible
- Questions should be clear and educational
- Vary difficulty slightly across questions`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const raw = completion.choices[0].message.content || "";
    // Strip any accidental markdown fences
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Groq AI error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}