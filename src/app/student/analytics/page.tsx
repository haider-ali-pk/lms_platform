"use client";

import React, { useEffect, useState } from "react";
import StudentSidebar from "@/components/student/StudentSidebar";
import {
  Brain, TrendingUp, TrendingDown, Target, BookOpen,
  CheckCircle, AlertCircle, Zap, RefreshCw, Award,
  BarChart3, Clock, Star, ArrowRight, Sparkles
} from "lucide-react";

interface SubjectPerformance {
  subject: string;
  avgScore: number;
  attempts: number;
}

interface Analytics {
  totalLessons: number;
  completedLessons: number;
  completionRate: number;
  avgQuizScore: number;
  passedQuizzes: number;
  failedQuizzes: number;
  totalCourses: number;
  subjectPerformance: SubjectPerformance[];
  weakSubjects: SubjectPerformance[];
  strongSubjects: SubjectPerformance[];
}

interface AIAnalysis {
  overallAssessment: string;
  strengthAreas: string[];
  weakAreas: string[];
  studyPlan: { priority: string; subject: string; action: string; timeframe: string }[];
  motivationalMessage: string;
  weeklyGoal: string;
  predictedImprovement: string;
}

export default function StudentAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function fetchAnalytics() {
    setRefreshing(true);
    const res = await fetch("/api/student/analytics");
    const data = await res.json();
    if (data.error) { setError(data.error); setRefreshing(false); setLoading(false); return; }
    setAnalytics(data.analytics);
    setAiAnalysis(data.aiAnalysis);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading) return (
    <div className="flex h-screen bg-gray-50">
      <StudentSidebar active="analytics" />
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
          <Brain size={28} className="text-white" />
        </div>
        <p className="text-gray-500 text-sm font-medium">AI is analyzing your performance...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar active="analytics" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Learning Analytics</h1>
              <p className="text-gray-500 text-sm mt-1">Personalized insights powered by AI</p>
            </div>
            <button onClick={fetchAnalytics} disabled={refreshing}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md text-gray-600 transition-all disabled:opacity-50">
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh Analysis
            </button>
          </div>

          {/* Stats grid */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Completion Rate", value: `${analytics.completionRate}%`, sub: `${analytics.completedLessons}/${analytics.totalLessons} lessons`, icon: <BookOpen size={18} />, color: "text-indigo-600 bg-indigo-50", bar: analytics.completionRate },
                { label: "Avg Quiz Score", value: `${analytics.avgQuizScore}%`, sub: `${analytics.passedQuizzes} passed, ${analytics.failedQuizzes} failed`, icon: <BarChart3 size={18} />, color: analytics.avgQuizScore >= 70 ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50", bar: analytics.avgQuizScore },
                { label: "Courses Enrolled", value: analytics.totalCourses, sub: "Active enrollments", icon: <Award size={18} />, color: "text-purple-600 bg-purple-50", bar: null },
                { label: "Strong Subjects", value: analytics.strongSubjects.length, sub: analytics.strongSubjects.map(s => s.subject).join(", ") || "Keep working!", icon: <Star size={18} />, color: "text-amber-600 bg-amber-50", bar: null },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>
                    <div>
                      <p className="text-gray-900 font-bold text-xl leading-none">{s.value}</p>
                      <p className="text-gray-500 text-xs mt-1">{s.label}</p>
                    </div>
                  </div>
                  {s.bar !== null && s.bar !== undefined && (
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                      <div className={`h-1.5 rounded-full transition-all ${s.bar >= 70 ? "bg-emerald-500" : s.bar >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(s.bar, 100)}%` }} />
                    </div>
                  )}
                  <p className="text-gray-400 text-xs mt-2 truncate">{s.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* AI Analysis */}
          {aiAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Overall Assessment */}
              <div className="lg:col-span-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Brain size={22} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-yellow-300" />
                      <span className="text-white/80 text-xs font-semibold uppercase tracking-wide">AI Assessment</span>
                    </div>
                    <p className="text-white text-sm leading-relaxed">{aiAnalysis.overallAssessment}</p>
                    <div className="mt-3 p-3 bg-white/10 rounded-xl">
                      <p className="text-yellow-200 text-xs font-semibold mb-1">💪 This Week's Goal</p>
                      <p className="text-white text-sm">{aiAnalysis.weeklyGoal}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <TrendingUp size={16} className="text-emerald-600" />
                  </div>
                  <h3 className="text-gray-900 font-semibold text-sm">Your Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {aiAnalysis.strengthAreas.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weak Areas */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <TrendingDown size={16} className="text-amber-600" />
                  </div>
                  <h3 className="text-gray-900 font-semibold text-sm">Areas to Improve</h3>
                </div>
                <ul className="space-y-2">
                  {aiAnalysis.weakAreas.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" /> {w}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Predicted Improvement */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Target size={16} className="text-purple-600" />
                  </div>
                  <h3 className="text-gray-900 font-semibold text-sm">Expected Progress</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{aiAnalysis.predictedImprovement}</p>
                <div className="mt-3 p-3 bg-indigo-50 rounded-xl">
                  <p className="text-indigo-700 text-xs italic">"{aiAnalysis.motivationalMessage}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Study Plan */}
          {aiAnalysis && aiAnalysis.studyPlan.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Zap size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold">Your Personalized Study Plan</h3>
                  <p className="text-gray-400 text-xs">AI-generated based on your performance</p>
                </div>
              </div>
              <div className="space-y-3">
                {aiAnalysis.studyPlan.map((item, i) => (
                  <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${item.priority === "high" ? "border-red-100 bg-red-50" : item.priority === "medium" ? "border-amber-100 bg-amber-50" : "border-emerald-100 bg-emerald-50"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${item.priority === "high" ? "bg-red-500 text-white" : item.priority === "medium" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-900 font-medium text-sm">{item.subject}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${item.priority === "high" ? "bg-red-100 text-red-600" : item.priority === "medium" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                          {item.priority} priority
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{item.action}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Clock size={12} /> {item.timeframe}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subject Performance Chart */}
          {analytics && analytics.subjectPerformance.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-gray-900 font-semibold mb-5">Subject Performance</h3>
              <div className="space-y-4">
                {analytics.subjectPerformance.map((s) => (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700 font-medium">{s.subject}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{s.attempts} attempts</span>
                        <span className={`text-sm font-bold ${s.avgScore >= 70 ? "text-emerald-600" : s.avgScore >= 50 ? "text-amber-600" : "text-red-600"}`}>
                          {s.avgScore}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${s.avgScore >= 70 ? "bg-emerald-500" : s.avgScore >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${s.avgScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No data state */}
          {analytics && analytics.totalLessons === 0 && analytics.avgQuizScore === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Brain size={40} className="text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-900 font-semibold mb-1">Not enough data yet</h3>
              <p className="text-gray-400 text-sm">Complete some lessons and quizzes to see your AI analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}