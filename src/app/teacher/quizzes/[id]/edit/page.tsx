"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Plus, Trash2, Sparkles, Save, ChevronDown,
  ChevronUp, GripVertical, Loader2, CheckCircle
} from "lucide-react";

interface Course { id: string; title: string }
interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  points: number;
}

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [courses, setCourses] = useState<Course[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", course_id: "",
    time_limit: "", pass_mark: "60", max_attempts: "3", is_published: false,
  });
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/teacher/courses-list").then(r => r.json()),
      fetch(`/api/teacher/quizzes/${id}`).then(r => r.json()),
    ]).then(([cData, qData]) => {
      setCourses(cData.courses || []);
      const quiz = qData.quiz;
      if (quiz) {
        setForm({
          title: quiz.title,
          description: quiz.description || "",
          course_id: quiz.course_id,
          time_limit: quiz.time_limit?.toString() || "",
          pass_mark: quiz.pass_mark.toString(),
          max_attempts: quiz.max_attempts.toString(),
          is_published: quiz.is_published,
        });
        setQuestions(quiz.questions.map((q: { id: string; question_text: string; options: string[]; correct_index: number; explanation: string | null; points: number }) => ({
          id: q.id,
          question_text: q.question_text,
          options: Array.isArray(q.options) ? q.options : Object.values(q.options),
          correct_index: q.correct_index,
          explanation: q.explanation || "",
          points: q.points,
        })));
      }
      setLoading(false);
    });
  }, [id]);

  function updateForm(key: string, value: string | boolean) { setForm(f => ({ ...f, [key]: value })); }
  function updateQuestion(qId: string, key: keyof Question, value: unknown) {
    setQuestions(qs => qs.map(q => q.id === qId ? { ...q, [key]: value } : q));
  }
  function updateOption(qId: string, idx: number, value: string) {
    setQuestions(qs => qs.map(q => {
      if (q.id !== qId) return q;
      const opts = [...q.options]; opts[idx] = value;
      return { ...q, options: opts };
    }));
  }
  function addQuestion() {
    const q = { id: crypto.randomUUID(), question_text: "", options: ["", "", "", ""], correct_index: 0, explanation: "", points: 1 };
    setQuestions(qs => [...qs, q]); setExpandedQ(q.id);
  }
  function removeQuestion(qId: string) { setQuestions(qs => qs.filter(q => q.id !== qId)); }

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
          id: crypto.randomUUID(), question_text: q.question_text,
          options: q.options, correct_index: q.correct_index,
          explanation: q.explanation || "", points: 1,
        }));
        setQuestions(qs => [...qs, ...mapped]);
        setShowAiPanel(false); setAiTopic("");
      }
    } finally { setAiLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/teacher/quizzes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        time_limit: form.time_limit ? parseInt(form.time_limit) : null,
        pass_mark: parseInt(form.pass_mark),
        max_attempts: parseInt(form.max_attempts),
        questions: questions.map((q, i) => ({ ...q, order: i })),
      }),
    });
    setSaving(false);
    router.push("/teacher/quizzes");
  }

  const OPTS = ["A", "B", "C", "D"];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading quiz...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => router.push("/teacher/quizzes")} className="text-sm text-gray-500 hover:text-indigo-600 mb-1 flex items-center gap-1">← Back to Quizzes</button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Quiz</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAiPanel(!showAiPanel)} className="flex items-center gap-2 px-4 py-2.5 border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl font-medium text-sm">
              <Sparkles size={16} /> AI Generate
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-sm">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
            </button>
          </div>
        </div>

        {showAiPanel && (
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1"><Sparkles size={20} /><h3 className="font-semibold text-lg">AI Question Generator</h3></div>
            <p className="text-indigo-200 text-sm mb-4">Powered by Groq LLaMA 3.3 70B</p>
            <div className="flex gap-3">
              <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="Enter topic..." className="flex-1 px-4 py-2.5 rounded-xl bg-white/20 border border-white/30 placeholder-indigo-200 text-white focus:outline-none text-sm" onKeyDown={e => e.key === "Enter" && generateAI()} />
              <select value={aiCount} onChange={e => setAiCount(Number(e.target.value))} className="px-4 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white text-sm">
                {[3, 5, 8, 10].map(n => <option key={n} value={n} className="text-gray-900">{n} questions</option>)}
              </select>
              <button onClick={generateAI} disabled={aiLoading || !aiTopic.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-medium text-sm hover:bg-indigo-50 disabled:opacity-50">
                {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {aiLoading ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        )}

        {/* Quiz Settings — same layout as create */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold">1</span>
            Quiz Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Quiz Title *</label>
              <input value={form.title} onChange={e => updateForm("title", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={e => updateForm("description", e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Course *</label>
              <select value={form.course_id} onChange={e => updateForm("course_id", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Time Limit (minutes)</label>
              <input type="number" value={form.time_limit} onChange={e => updateForm("time_limit", e.target.value)} placeholder="No limit" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Pass Mark (%)</label>
              <input type="number" value={form.pass_mark} onChange={e => updateForm("pass_mark", e.target.value)} min={0} max={100} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Max Attempts</label>
              <input type="number" value={form.max_attempts} onChange={e => updateForm("max_attempts", e.target.value)} min={1} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2 flex items-center gap-3 pt-1">
              <button
                onClick={() => updateForm("is_published", !form.is_published)}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.is_published ? "bg-indigo-600" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_published ? "left-5" : "left-0.5"}`} />
              </button>
              <span className="text-sm text-gray-700">{form.is_published ? "Published" : "Draft"}</span>
            </div>
          </div>
        </div>

        {/* Questions — identical to create */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold">2</span>
              Questions <span className="ml-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{questions.length}</span>
            </h2>
            <button onClick={addQuestion} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"><Plus size={16} /> Add Question</button>
          </div>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}>
                  <GripVertical size={16} className="text-gray-300 shrink-0" />
                  <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{q.question_text || <span className="text-gray-400">Click to edit question...</span>}</span>
                  {q.question_text && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={e => { e.stopPropagation(); removeQuestion(q.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    {expandedQ === q.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>
                {expandedQ === q.id && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-4 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1.5 block">Question Text *</label>
                      <textarea value={q.question_text} onChange={e => updateQuestion(q.id, "question_text", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-2 block">Answer Options</label>
                      <div className="space-y-2">
                        {q.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <button onClick={() => updateQuestion(q.id, "correct_index", i)} className={`w-8 h-8 rounded-lg text-xs font-bold shrink-0 transition-all ${q.correct_index === i ? "bg-emerald-500 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"}`}>{OPTS[i]}</button>
                            <input value={opt} onChange={e => updateOption(q.id, i, e.target.value)} placeholder={`Option ${OPTS[i]}...`} className={`flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${q.correct_index === i ? "border-emerald-300 bg-emerald-50" : "border-gray-200"}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">Explanation</label>
                        <input value={q.explanation} onChange={e => updateQuestion(q.id, "explanation", e.target.value)} placeholder="Why is this correct?" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">Points</label>
                        <input type="number" value={q.points} onChange={e => updateQuestion(q.id, "points", Number(e.target.value))} min={1} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={addQuestion} className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
            <Plus size={16} /> Add Another Question
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => router.push("/teacher/quizzes")} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
