"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import StudentSidebar from "@/components/student/StudentSidebar";
import {
  Bot, Send, Plus, Trash2, MessageSquare, ArrowLeft,
  Sparkles, BookOpen, Code, FlaskConical, Calculator,
  Globe, Pencil, ChevronDown, X, Loader2
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string; }
interface Session {
  id: string; title: string; subject: string;
  updated_at: string; _count: { messages: number };
}

// ── Subjects ───────────────────────────────────────────────────────────────
const SUBJECTS = [
  { value: "general",     label: "General",     icon: Sparkles,    color: "text-indigo-500",  bg: "bg-indigo-50" },
  { value: "mathematics", label: "Mathematics", icon: Calculator,  color: "text-blue-500",    bg: "bg-blue-50" },
  { value: "science",     label: "Science",     icon: FlaskConical,color: "text-emerald-500", bg: "bg-emerald-50" },
  { value: "programming", label: "Programming", icon: Code,        color: "text-purple-500",  bg: "bg-purple-50" },
  { value: "literature",  label: "Literature",  icon: BookOpen,    color: "text-amber-500",   bg: "bg-amber-50" },
  { value: "history",     label: "History",     icon: Globe,       color: "text-rose-500",    bg: "bg-rose-50" },
  { value: "writing",     label: "Writing",     icon: Pencil,      color: "text-teal-500",    bg: "bg-teal-50" },
];

// ── Markdown renderer (no external lib) ───────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto my-3 text-sm"><code class="language-${lang || ''}">${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
    .replace(/`([^`]+)`/g, `<code class="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>`)
    .replace(/^### (.+)$/gm, `<h3 class="text-base font-bold text-gray-900 mt-4 mb-2">$1</h3>`)
    .replace(/^## (.+)$/gm,  `<h2 class="text-lg font-bold text-gray-900 mt-5 mb-2">$1</h2>`)
    .replace(/^# (.+)$/gm,   `<h1 class="text-xl font-bold text-gray-900 mt-5 mb-3">$1</h1>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong class="font-semibold text-gray-900">$1</strong>`)
    .replace(/\*(.+?)\*/g,    `<em class="italic">$1</em>`)
    .replace(/^\s*[-*] (.+)$/gm, `<li class="ml-4 list-disc text-gray-700">$1</li>`)
    .replace(/^\s*\d+\. (.+)$/gm, `<li class="ml-4 list-decimal text-gray-700">$1</li>`)
    .replace(/(<li[\s\S]+?<\/li>)/g, `<ul class="my-2 space-y-1">$1</ul>`)
    .replace(/\n\n/g, `</p><p class="mb-3">`)
    .replace(/\n/g, "<br/>")
    .replace(/^(.)/,  `<p class="mb-3">$1`)
    .replace(/(.)$/, `$1</p>`);
}

// ── Message bubble ─────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold ${isUser ? "bg-indigo-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"}`}>
        {isUser ? "U" : <Bot size={16} />}
      </div>
      {/* Bubble */}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm"}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
        )}
      </div>
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <Bot size={16} />
      </div>
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── Suggested prompts ──────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Explain quantum physics in simple terms",
  "Help me solve quadratic equations step by step",
  "Write a Python function to sort a list",
  "Summarize the causes of World War I",
  "How do I write a strong essay introduction?",
  "Explain the water cycle with examples",
];

// ── Main page ──────────────────────────────────────────────────────────────
export default function StudentAITutorPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("general");
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSubject = SUBJECTS.find((s) => s.value === subject) ?? SUBJECTS[0];

  // Load sessions
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    const r = await fetch("/api/student/ai/sessions");
    const d = await r.json();
    setSessions(d.sessions ?? []);
    setLoadingSessions(false);
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Load messages for a session
  const openSession = useCallback(async (id: string) => {
    setActiveSession(id);
    setLoadingMessages(true);
    setMessages([]);
    const r = await fetch(`/api/student/ai/sessions/${id}`);
    const d = await r.json();
    setMessages(d.messages?.map((m: any) => ({ role: m.role, content: m.content })) ?? []);
    const sess = sessions.find((s) => s.id === id);
    if (sess) setSubject(sess.subject ?? "general");
    setLoadingMessages(false);
  }, [sessions]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const newChat = () => {
    setActiveSession(null);
    setMessages([]);
    setInput("");
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    await fetch(`/api/student/ai/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession === id) newChat();
    setDeletingId(null);
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content };
    const history = [...messages];
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const r = await fetch("/api/student/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          session_id: activeSession,
          subject,
          history: history.slice(-10),
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);

      setMessages((prev) => [...prev, { role: "assistant", content: d.reply }]);

      if (!activeSession) {
        setActiveSession(d.session_id);
        await loadSessions();
      } else {
        setSessions((prev) =>
          prev.map((s) => s.id === activeSession ? { ...s, updated_at: new Date().toISOString(), _count: { messages: s._count.messages + 2 } } : s)
        );
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, something went wrong: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar active="ai" />

      {/* ── Sessions sidebar ── */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={newChat}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} /> New Chat
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loadingSessions ? (
            <div className="space-y-2 p-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center p-4">No conversations yet</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => openSession(s.id)}
                className={`group flex items-start gap-2 p-3 rounded-xl cursor-pointer transition-all ${activeSession === s.id ? "bg-indigo-50 border border-indigo-100" : "hover:bg-gray-50"}`}
              >
                <MessageSquare size={15} className={`mt-0.5 shrink-0 ${activeSession === s.id ? "text-indigo-500" : "text-gray-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${activeSession === s.id ? "text-indigo-700" : "text-gray-700"}`}>{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{s.subject} · {s._count.messages} msgs</p>
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all shrink-0"
                >
                  {deletingId === s.id ? <Loader2 size={13} className="text-red-400 animate-spin" /> : <Trash2 size={13} className="text-red-400" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">AI Tutor</h1>
              <p className="text-xs text-gray-400">Powered by LLaMA 3.3 70B</p>
            </div>
          </div>

          {/* Subject selector */}
          <div className="relative">
            <button
              onClick={() => setShowSubjectMenu(!showSubjectMenu)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${activeSubject.bg} border-gray-200 hover:border-gray-300`}
            >
              <activeSubject.icon size={15} className={activeSubject.color} />
              <span className="text-gray-700">{activeSubject.label}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {showSubjectMenu && (
              <div className="absolute right-0 top-11 bg-white rounded-2xl border border-gray-100 shadow-lg z-20 p-2 w-48">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { setSubject(s.value); setShowSubjectMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${subject === s.value ? `${s.bg} font-semibold` : "hover:bg-gray-50"}`}
                  >
                    <s.icon size={15} className={s.color} />
                    <span className="text-gray-700">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={28} className="text-indigo-400 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center h-full gap-6 pb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles size={28} className="text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">How can I help you learn today?</h2>
                <p className="text-sm text-gray-400 mt-1">Ask me anything — I'm here to explain, guide, and teach.</p>
              </div>
              {/* Suggestion chips */}
              <div className="grid grid-cols-2 gap-2 max-w-xl w-full">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm text-gray-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-all shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="bg-white border-t border-gray-100 px-6 py-4 shrink-0">
          <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none max-h-40"
            />
            {input && (
              <button onClick={() => setInput("")} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mb-0.5">
                <X size={16} />
              </button>
            )}
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 rounded-xl flex items-center justify-center transition-all shrink-0"
            >
              {loading ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">AI can make mistakes. Always verify important information.</p>
        </div>
      </div>

      {/* Click outside to close subject menu */}
      {showSubjectMenu && <div className="fixed inset-0 z-10" onClick={() => setShowSubjectMenu(false)} />}
    </div>
  );
}
