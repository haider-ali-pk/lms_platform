"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Sparkles, Save, ChevronDown,
  ChevronUp, GripVertical, Loader2, CheckCircle
} from "lucide-react";

interface Course { id: string; title: string; subject: string | null }
interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  points: number;
}

const newQuestion = (): Question => ({
  id: crypto.randomUUID(),
  question_text: "",
  options: ["", "", "", ""],
  correct_index: 0,
  explanation: "",
  points: 1,
});

export default function CreateQuizPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    course_id: "",
    time_limit: "",
    pass_mark: "60",
    max_attempts: "3",
    is_published: false,
  });
  const [questions, setQuestions] = useState<Question[]>([newQuestion()]);

  useEffect(() => {
    fetch("/api/teacher/courses-list").then(r => r.json()).then(d => {
      setCourses(d.courses || []);
      if (d.courses?.length > 0) setForm(f => ({ ...f, course_id: d.courses[0].id }));
    });
  }, []);

  function updateForm(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function updateQuestion(id: string, key: keyof Question, value: unknown) {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, [key]: value } : q));
  }

  function updateOption(qId: string, idx: number, value: string) {
    setQuestions(qs => qs.map(q => {
      if (q.id !== qId) return q;
      const opts = [...q.options];
      opts[idx] = value;
      return { ...q, options: opts };
    }));
  }

  function addQuestion() {
    const q = newQuestion();
    setQuestions(qs => [...qs, q]);
    setExpandedQ(q.id);
  }

  function removeQuestion(id: string) {
    setQuestions(qs => qs.filter(q => q.id !== id));
  }

  async function generateAI() {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/teacher/quizzes/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, count: aiCount }),
      });
      const data = await res.json();
      if (data.questions) {
        const mapped: Question[] = data.questions.map((q: { question_text: string; options: string[]; correct_index: number; explanation: string }) => ({
          id: crypto.randomUUID(),
          question_text: q.question_text,
          options: q.options,
          correct_index: q.correct_index,
          explanation: q.explanation || "",
          points: 1,
        }));
        setQuestions(qs => {
          // remove blank starter if present
          const cleaned = qs.filter(q => q.question_text.trim() !== "");
          return [...cleaned, ...mapped];
        });
        setShowAiPanel(false);
        setAiTopic("");
      }
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave(publish = false) {
    if (!form.title || !form.course_id) return alert("Title and course are required");
    if (questions.some(q => !q.question_text.trim())) return alert("All questions must have text");
    if (questions.some(q => q.options.some(o => !o.trim()))) return alert("All options must be filled in");

    setSaving(true);
    const res = await fetch("/api/teacher/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        time_limit: form.time_limit ? parseInt(form.time_limit) : null,
        pass_mark: parseInt(form.pass_mark),
        max_attempts: parseInt(form.max_attempts),
        is_published: publish,
        questions: questions.map((q, i) => ({ ...q, order: i })),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.id) router.push("/teacher/quizzes");
  }

  const OPTS = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => router.push("/teacher/quizzes")} className="text-sm text-gray-500 hover:text-indigo-600 mb-1 flex items-center gap-1 transition-colors">
              ← Back to Quizzes
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Create Quiz</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl font-medium text-sm transition-all"
            >
              <Sparkles size={16} /> AI Generate
            </button>
            <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium text-sm transition-colors">
              Save Draft
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Publish</>}
            </button>
          </div>
        </div>

        {/* AI Panel */}
        {showAiPanel && (
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={20} />
              <h3 className="font-semibold text-lg">AI Question Generator</h3>
            </div>
            <p className="text-indigo-200 text-sm mb-4">Powered by Groq LLaMA 3.3 70B — generates MCQ questions instantly</p>
            <div className="flex gap-3">
              <input
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                placeholder="e.g. Photosynthesis, World War II, Algebra basics..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/20 border border-white/30 placeholder-indigo-200 text-white focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                onKeyDown={e => e.key === "Enter" && generateAI()}
              />
              <select
                value={aiCount}
                onChange={e => setAiCount(Number(e.target.value))}
                className="px-4 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none text-sm"
              >
                {[3, 5, 8, 10].map(n => <option key={n} value={n} className="text-gray-900">{n} questions</option>)}
              </select>
              <button
                onClick={generateAI}
                disabled={aiLoading || !aiTopic.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-medium text-sm hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {aiLoading ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        )}

        {/* Quiz Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold">1</span>
            Quiz Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Quiz Title *</label>
              <input
                value={form.title}
                onChange={e => updateForm("title", e.target.value)}
                placeholder="e.g. Chapter 3 Assessment — Cell Biology"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => updateForm("description", e.target.value)}
                placeholder="Brief instructions for students..."
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Course *</label>
              <select
                value={form.course_id}
                onChange={e => updateForm("course_id", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select course...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Time Limit (minutes)</label>
              <input
                type="number"
                value={form.time_limit}
                onChange={e => updateForm("time_limit", e.target.value)}
                placeholder="Leave blank for no limit"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Pass Mark (%)</label>
              <input
                type="number"
                value={form.pass_mark}
                onChange={e => updateForm("pass_mark", e.target.value)}
                min={0} max={100}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Max Attempts</label>
              <input
                type="number"
                value={form.max_attempts}
                onChange={e => updateForm("max_attempts", e.target.value)}
                min={1}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold">2</span>
              Questions
              <span className="ml-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{questions.length}</span>
            </h2>
            <button
              onClick={addQuestion}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Plus size={16} /> Add Question
            </button>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="border border-gray-100 rounded-xl overflow-hidden">
                {/* Question header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                >
                  <GripVertical size={16} className="text-gray-300 shrink-0" />
                  <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 truncate">
                    {q.question_text || <span className="text-gray-400">Click to enter question...</span>}
                  </span>
                  {q.question_text && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    {expandedQ === q.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {/* Expanded editor */}
                {expandedQ === q.id && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-4 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1.5 block">Question Text *</label>
                      <textarea
                        value={q.question_text}
                        onChange={e => updateQuestion(q.id, "question_text", e.target.value)}
                        placeholder="Enter your question..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-2 block">Answer Options — click the correct answer</label>
                      <div className="space-y-2">
                        {q.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuestion(q.id, "correct_index", i)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold shrink-0 transition-all ${q.correct_index === i ? "bg-emerald-500 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"}`}
                            >
                              {OPTS[i]}
                            </button>
                            <input
                              value={opt}
                              onChange={e => updateOption(q.id, i, e.target.value)}
                              placeholder={`Option ${OPTS[i]}...`}
                              className={`flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${q.correct_index === i ? "border-emerald-300 bg-emerald-50" : "border-gray-200"}`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Green = correct answer</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">Explanation (optional)</label>
                        <input
                          value={q.explanation}
                          onChange={e => updateQuestion(q.id, "explanation", e.target.value)}
                          placeholder="Why is this the correct answer?"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">Points</label>
                        <input
                          type="number"
                          value={q.points}
                          onChange={e => updateQuestion(q.id, "points", Number(e.target.value))}
                          min={1}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addQuestion}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Another Question
          </button>
        </div>

        {/* Bottom actions */}
        <div className="flex justify-end gap-3">
          <button onClick={() => router.push("/teacher/quizzes")} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={() => handleSave(false)} disabled={saving} className="px-5 py-2.5 border border-indigo-200 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50">Save Draft</button>
          <button onClick={() => handleSave(true)} disabled={saving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Publish Quiz
          </button>
        </div>
      </div>
    </div>
  );
}