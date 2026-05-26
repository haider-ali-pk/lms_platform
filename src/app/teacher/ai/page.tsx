"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send, Sparkles, Plus, Trash2, Copy, Check,
  BookOpen, Code, Calculator, Globe, Lightbulb,
  MessageSquare, ChevronLeft, Menu, X, Share2
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Session {
  id: string;
  title: string;
  subject: string | null;
  created_at: string;
  _count: { messages: number };
}

const SUBJECTS = [
  { label: "General", value: "general", icon: "🌐" },
  { label: "Mathematics", value: "mathematics", icon: "📐" },
  { label: "Science", value: "science", icon: "🔬" },
  { label: "English", value: "english", icon: "📝" },
  { label: "History", value: "history", icon: "🏛️" },
  { label: "Computer Science", value: "cs", icon: "💻" },
  { label: "Physics", value: "physics", icon: "⚛️" },
  { label: "Chemistry", value: "chemistry", icon: "🧪" },
  { label: "Biology", value: "biology", icon: "🧬" },
  { label: "Geography", value: "geography", icon: "🗺️" },
];

const SUGGESTED_PROMPTS = [
  { icon: BookOpen, text: "Explain the concept of photosynthesis in simple terms", color: "emerald" },
  { icon: Calculator, text: "Create a step-by-step lesson plan for teaching fractions", color: "indigo" },
  { icon: Code, text: "Write a Python function to sort a list and explain how it works", color: "violet" },
  { icon: Globe, text: "What were the main causes of World War II?", color: "amber" },
  { icon: Lightbulb, text: "Give me 10 creative quiz questions about the solar system", color: "rose" },
  { icon: MessageSquare, text: "How do I explain algebra to a struggling student?", color: "cyan" },
];

const colorMap: Record<string, string> = {
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
  indigo: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
  violet: "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100",
  amber: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
  rose: "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100",
  cyan: "bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100",
};

export default function AITutorPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [subject, setSubject] = useState("general");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { fetchSessions(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamText]);

  async function fetchSessions() {
    const res = await fetch("/api/teacher/ai/sessions");
    const data = await res.json();
    setSessions(data.sessions || []);
  }

  async function loadSession(sessionId: string) {
    setActiveSession(sessionId);
    setMessages([]);
    setStreamText("");
    const res = await fetch(`/api/teacher/ai/sessions/${sessionId}`);
    const data = await res.json();
    setMessages(data.messages || []);
    if (data.session?.subject) setSubject(data.session.subject);
  }

  async function newSession() {
    setActiveSession(null);
    setMessages([]);
    setStreamText("");
    setInput("");
    setSubject("general");
  }

  async function deleteSession(id: string) {
    await fetch(`/api/teacher/ai/sessions/${id}`, { method: "DELETE" });
    setDeleteId(null);
    if (activeSession === id) newSession();
    fetchSessions();
  }

  async function sendMessage(text?: string) {
    const content = (text || input).trim();
    if (!content || streaming) return;

    setInput("");
    setStreaming(true);
    setStreamText("");

    // Add user message optimistically
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch("/api/teacher/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          session_id: activeSession,
          subject,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (data.session_id && !activeSession) {
        setActiveSession(data.session_id);
        fetchSessions();
      }

      // Simulate streaming by revealing text progressively
      const fullText = data.reply || "";
      let i = 0;
      const interval = setInterval(() => {
        i += 3;
        setStreamText(fullText.slice(0, i));
        if (i >= fullText.length) {
          clearInterval(interval);
          setStreaming(false);
          setStreamText("");
          const assistantMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: fullText,
            created_at: new Date().toISOString(),
          };
          setMessages(prev => [...prev, assistantMsg]);
          fetchSessions();
        }
      }, 8);

    } catch {
      setStreaming(false);
      setStreamText("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function copySession() {
    if (!activeSession) return;
    const url = `${window.location.origin}/teacher/ai-tutor?session=${activeSession}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const subjectInfo = SUBJECTS.find(s => s.value === subject);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 overflow-hidden bg-white border-r border-gray-100 flex flex-col shrink-0`}>
        <div className="p-4 border-b border-gray-100">
          <button onClick={() => router.push("/teacher/dashboard")} className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1 mb-3 transition-colors">
            <ChevronLeft size={14} /> Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm">AI Tutor</h1>
                <p className="text-xs text-gray-400">Powered by LLaMA 3.3 70B</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3">
          <button
            onClick={newSession}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} /> New Conversation
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No conversations yet</p>
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${activeSession === s.id ? "bg-indigo-50 border border-indigo-100" : "hover:bg-gray-50"}`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${activeSession === s.id ? "text-indigo-700" : "text-gray-700"}`}>{s.title}</p>
                  <p className="text-xs text-gray-400">{s._count.messages} messages · {new Date(s.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setDeleteId(s.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Subject selector */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-gray-500">Subject:</span>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              {SUBJECTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSubject(s.value)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${subject === s.value ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  <span>{s.icon}</span> {s.label}
                </button>
              ))}
            </div>
          </div>

          {activeSession && (
            <button
              onClick={copySession}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 rounded-lg transition-all"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
              {copied ? "Copied!" : "Share"}
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.length === 0 && !streaming ? (
            /* Welcome screen */
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                  <Sparkles size={28} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Tutor</h2>
                <p className="text-gray-500">Ask me anything — science, math, history, coding, literature, or any topic. I know it all.</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">
                    {subjectInfo?.icon} {subjectInfo?.label} mode
                  </span>
                </div>
              </div>

              {/* Suggested prompts */}
              <div className="grid grid-cols-2 gap-3">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.text)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all hover:shadow-sm ${colorMap[p.color]}`}
                  >
                    <p.icon size={18} className="shrink-0 mt-0.5" />
                    <span className="text-sm font-medium leading-snug">{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <Sparkles size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user" ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3" : "bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3"}`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                    <p className={`text-xs mt-1.5 ${msg.role === "user" ? "text-indigo-200" : "text-gray-400"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 mt-1">
                      <span className="text-indigo-600 font-bold text-sm">T</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming message */}
              {streaming && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div className="max-w-[80%] bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                    {streamText ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
                        <ReactMarkdown>{streamText}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-gray-100 px-4 py-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder={`Ask anything about ${subjectInfo?.label.toLowerCase()}... (Enter to send, Shift+Enter for new line)`}
                rows={1}
                disabled={streaming}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none max-h-[120px] leading-relaxed disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || streaming}
                className="shrink-0 w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl flex items-center justify-center transition-all shadow-sm disabled:shadow-none"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">AI can make mistakes. Verify important information.</p>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Conversation</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This will permanently delete this conversation and all messages.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteSession(deleteId)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}