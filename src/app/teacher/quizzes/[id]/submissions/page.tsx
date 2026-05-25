"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Users, CheckCircle, XCircle, Clock, Award, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface Submission {
  id: string;
  score: number;
  passed: boolean;
  time_taken: number | null;
  submitted_at: string;
  attempt_number: number;
  student: { id: string; first_name: string; last_name: string; email: string; avatar_url: string | null };
  answers: number[];
}

interface Quiz {
  id: string;
  title: string;
  pass_mark: number;
  questions: { id: string; question_text: string; options: string[]; correct_index: number }[];
  _count: { attempts: number };
  avg_score: number | null;
  pass_rate: number | null;
}

export default function QuizSubmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/teacher/quizzes/${id}/submissions`)
      .then(r => r.json())
      .then(d => { setQuiz(d.quiz); setSubmissions(d.submissions || []); setLoading(false); });
  }, [id]);

  const OPTS = ["A", "B", "C", "D"];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <button onClick={() => router.push("/teacher/quizzes")} className="text-sm text-gray-500 hover:text-indigo-600 mb-1 flex items-center gap-1 transition-colors">← Back to Quizzes</button>
          <h1 className="text-2xl font-bold text-gray-900">{quiz?.title}</h1>
          <p className="text-gray-500 text-sm mt-1">Student submissions and results</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Attempts", value: quiz?._count.attempts ?? 0, icon: Users, bg: "bg-indigo-50", text: "text-indigo-600", border: "border-l-indigo-500" },
            { label: "Avg Score", value: quiz?.avg_score != null ? `${Math.round(quiz.avg_score)}%` : "—", icon: Award, bg: "bg-amber-50", text: "text-amber-600", border: "border-l-amber-500" },
            { label: "Pass Rate", value: quiz?.pass_rate != null ? `${Math.round(quiz.pass_rate)}%` : "—", icon: CheckCircle, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-l-emerald-500" },
            { label: "Pass Mark", value: `${quiz?.pass_mark ?? 60}%`, icon: Award, bg: "bg-violet-50", text: "text-violet-600", border: "border-l-violet-500" },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 ${s.border}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{s.label}</span>
                <div className={`${s.bg} p-2 rounded-lg`}><s.icon size={16} className={s.text} /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Submissions list */}
        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="bg-indigo-50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">No submissions yet</h3>
            <p className="text-gray-500 text-sm">Students haven't attempted this quiz yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Submissions ({submissions.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {submissions.map((sub) => {
                const pct = Math.round((sub.score / (quiz?.questions.length || 1)) * 100);
                const isExpanded = expanded === sub.id;
                return (
                  <div key={sub.id}>
                    <div
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setExpanded(isExpanded ? null : sub.id)}
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
                        {sub.student.first_name[0]}{sub.student.last_name[0]}
                      </div>
                      {/* Student info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{sub.student.first_name} {sub.student.last_name}</p>
                        <p className="text-xs text-gray-500">{sub.student.email}</p>
                      </div>
                      {/* Score bar */}
                      <div className="flex-1 max-w-[200px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">{sub.score}/{quiz?.questions.length} correct</span>
                          <span className={`text-xs font-bold ${pct >= (quiz?.pass_mark || 60) ? "text-emerald-600" : "text-red-500"}`}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= (quiz?.pass_mark || 60) ? "bg-emerald-500" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      {/* Badge */}
                      <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${sub.passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        {sub.passed ? "Passed" : "Failed"}
                      </span>
                      {/* Time */}
                      {sub.time_taken && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                          <Clock size={12} /> {Math.round(sub.time_taken / 60)}m
                        </div>
                      )}
                      {/* Date */}
                      <span className="text-xs text-gray-400 shrink-0">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                    </div>

                    {/* Expanded answers */}
                    {isExpanded && quiz && (
                      <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                        <div className="pt-4 space-y-3">
                          {quiz.questions.map((qst, qi) => {
                            const studentAns = sub.answers[qi];
                            const isCorrect = studentAns === qst.correct_index;
                            return (
                              <div key={qst.id} className={`bg-white rounded-xl p-4 border ${isCorrect ? "border-emerald-100" : "border-red-100"}`}>
                                <div className="flex items-start gap-2 mb-3">
                                  {isCorrect
                                    ? <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                    : <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />}
                                  <p className="text-sm text-gray-800 font-medium">Q{qi + 1}. {qst.question_text}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pl-6">
                                  {qst.options.map((opt, oi) => (
                                    <div key={oi} className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 ${oi === qst.correct_index ? "bg-emerald-50 text-emerald-700 font-medium" : oi === studentAns && !isCorrect ? "bg-red-50 text-red-600" : "text-gray-500"}`}>
                                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 ${oi === qst.correct_index ? "bg-emerald-200 text-emerald-700" : oi === studentAns && !isCorrect ? "bg-red-200 text-red-600" : "bg-gray-100 text-gray-400"}`}>{OPTS[oi]}</span>
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}