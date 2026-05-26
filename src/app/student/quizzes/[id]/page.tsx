"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, Trophy, AlertCircle } from "lucide-react";
import StudentSidebar from "@/components/student/StudentSidebar";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  points: number;
  order: number;
}

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  time_limit: number | null;
  pass_mark: number;
  max_attempts: number;
  course_title: string;
  attempts_used: number;
  can_attempt: boolean;
  questions: Question[];
  past_attempts: { id: string; score: number; passed: boolean; time_taken: number | null; submitted_at: string }[];
}

interface Result {
  question: string;
  options: string[];
  student_answer: number;
  correct_answer: number;
  explanation: string | null;
  is_correct: boolean;
  points: number;
}

type Phase = "intro" | "quiz" | "result";

export default function QuizAttemptPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    fetch(`/api/student/quizzes/${id}`).then(r => r.json()).then(d => {
      setQuiz(d.quiz);
      setLoading(false);
    });
  }, [id]);

  const submitQuiz = useCallback(async (ans: (number | null)[]) => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const res = await fetch(`/api/student/quizzes/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: ans, time_taken: timeTaken }),
    });
    const data = await res.json();
    setScore(data.score);
    setPassed(data.passed);
    setResults(data.results || []);
    setEarnedPoints(data.earnedPoints);
    setTotalPoints(data.totalPoints);
    setPhase("result");
    setSubmitting(false);
  }, [quiz, submitting, startTime, id]);

  // Timer
  useEffect(() => {
    if (phase !== "quiz" || !quiz?.time_limit) return;
    if (timeLeft <= 0 && phase === "quiz") {
      submitQuiz(answers);
      return;
    }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, quiz, answers, submitQuiz]);

  function startQuiz() {
    if (!quiz) return;
    setAnswers(new Array(quiz.questions.length).fill(null));
    setCurrent(0);
    if (quiz.time_limit) setTimeLeft(quiz.time_limit * 60);
    setStartTime(Date.now());
    setPhase("quiz");
  }

  function selectAnswer(idx: number) {
    setAnswers(prev => { const a = [...prev]; a[current] = idx; return a; });
  }

  function next() {
    if (!quiz) return;
    if (current < quiz.questions.length - 1) setCurrent(p => p + 1);
    else submitQuiz(answers);
  }

  function prev() { if (current > 0) setCurrent(p => p - 1); }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const timeWarning = timeLeft > 0 && timeLeft < 60;

  if (loading) return (
    <div className="flex h-screen bg-gray-50">
      <StudentSidebar active="quizzes" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!quiz) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar active="quizzes" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-3xl mx-auto">
          <button onClick={() => router.push("/student/quizzes")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
            <ChevronLeft size={16} /> Back to Quizzes
          </button>

          {/* INTRO PHASE */}
          {phase === "intro" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-600" />
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trophy size={28} className="text-indigo-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
                <p className="text-gray-500 mb-2">{quiz.course_title}</p>
                {quiz.description && <p className="text-sm text-gray-500 mb-6">{quiz.description}</p>}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {[
                    { label: "Questions", value: quiz.questions.length },
                    { label: "Time Limit", value: quiz.time_limit ? `${quiz.time_limit} min` : "No limit" },
                    { label: "Pass Mark", value: `${quiz.pass_mark}%` },
                    { label: "Attempts Left", value: quiz.max_attempts - quiz.attempts_used },
                  ].map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Past attempts */}
                {quiz.past_attempts.length > 0 && (
                  <div className="mb-8 text-left">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Past Attempts</p>
                    <div className="space-y-2">
                      {quiz.past_attempts.map((a, i) => (
                        <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                          <span className="text-sm text-gray-600">Attempt {i + 1} — {new Date(a.submitted_at).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            {a.passed ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-400" />}
                            <span className={`text-sm font-semibold ${a.passed ? "text-emerald-600" : "text-red-500"}`}>{a.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {quiz.can_attempt ? (
                  <button onClick={startQuiz} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm">
                    {quiz.attempts_used === 0 ? "Start Quiz" : "Retry Quiz"}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-gray-500 bg-gray-50 rounded-xl py-3">
                    <AlertCircle size={16} /> No attempts remaining
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QUIZ PHASE */}
          {phase === "quiz" && quiz.questions[current] && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">Question {current + 1} of {quiz.questions.length}</span>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{quiz.questions[current].points} pt{quiz.questions[current].points > 1 ? "s" : ""}</span>
                </div>
                {quiz.time_limit && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-mono font-bold ${timeWarning ? "bg-red-50 text-red-500 animate-pulse" : "bg-gray-50 text-gray-700"}`}>
                    <Clock size={14} /> {formatTime(timeLeft)}
                  </div>
                )}
              </div>

              {/* Question */}
              <div className="p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 leading-relaxed">{quiz.questions[current].question_text}</h2>

                {/* Options */}
                <div className="space-y-3 mb-8">
                  {(quiz.questions[current].options as string[]).map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectAnswer(idx)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${answers[current] === idx ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${answers[current] === idx ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={`text-sm ${answers[current] === idx ? "text-indigo-700 font-medium" : "text-gray-700"}`}>{opt}</span>
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button onClick={prev} disabled={current === 0} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft size={16} /> Previous
                  </button>

                  {/* Dot progress */}
                  <div className="flex gap-1.5">
                    {quiz.questions.map((_, i) => (
                      <button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-indigo-600 w-5" : answers[i] !== null ? "bg-indigo-300" : "bg-gray-200"}`} />
                    ))}
                  </div>

                  <button
                    onClick={next}
                    disabled={submitting}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${current === quiz.questions.length - 1 ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                  >
                    {submitting ? "Submitting..." : current === quiz.questions.length - 1 ? "Submit Quiz" : "Next"}
                    {!submitting && current < quiz.questions.length - 1 && <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RESULT PHASE */}
          {phase === "result" && (
            <div className="space-y-6">
              {/* Score card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`h-2 ${passed ? "bg-emerald-500" : "bg-red-400"}`} />
                <div className="p-8 text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? "bg-emerald-50" : "bg-red-50"}`}>
                    {passed ? <Trophy size={36} className="text-emerald-500" /> : <XCircle size={36} className="text-red-400" />}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{passed ? "Congratulations!" : "Better luck next time"}</h2>
                  <p className="text-gray-500 mb-6">{passed ? "You passed the quiz!" : `You needed ${quiz.pass_mark}% to pass`}</p>

                  <div className="text-6xl font-bold mb-2" style={{ color: passed ? "#10b981" : "#ef4444" }}>{score}%</div>
                  <p className="text-gray-500 text-sm mb-6">{earnedPoints} / {totalPoints} points</p>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-emerald-600">{results.filter(r => r.is_correct).length}</p>
                      <p className="text-xs text-gray-500">Correct</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-red-500">{results.filter(r => !r.is_correct).length}</p>
                      <p className="text-xs text-gray-500">Wrong</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-indigo-600">{quiz.questions.length}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button onClick={() => router.push("/student/quizzes")} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                      Back to Quizzes
                    </button>
                    {quiz.can_attempt && (
                      <button onClick={() => { setPhase("intro"); }} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all">
                        Try Again
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Answer review */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Answer Review</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {results.map((r, i) => (
                    <div key={i} className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${r.is_correct ? "bg-emerald-100" : "bg-red-50"}`}>
                          {r.is_correct ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-400" />}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{r.question}</p>
                      </div>
                      <div className="ml-9 space-y-2">
                        {(r.options as string[]).map((opt, idx) => (
                          <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${idx === r.correct_answer ? "bg-emerald-50 text-emerald-700 font-medium" : idx === r.student_answer && !r.is_correct ? "bg-red-50 text-red-600" : "text-gray-500"}`}>
                            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${idx === r.correct_answer ? "bg-emerald-500 text-white" : idx === r.student_answer && !r.is_correct ? "bg-red-400 text-white" : "bg-gray-100 text-gray-400"}`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            {opt}
                          </div>
                        ))}
                        {r.explanation && (
                          <div className="mt-2 flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2">
                            <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700">{r.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
