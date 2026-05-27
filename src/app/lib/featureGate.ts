export const SCHOOL_PLAN_RANK: Record<string, number> = {
  trial: 0,
  starter: 1,
  growth: 2,
  enterprise: 3,
};

export const STUDENT_AI_RANK: Record<string, number> = {
  none: -1,
  free: 0,
  basic: 1,
  pro: 2,
};

export function schoolHasFeature(
  schoolPlan: string | null | undefined,
  requiredPlan: "trial" | "starter" | "growth" | "enterprise"
): boolean {
  if (!schoolPlan) return false;
  return (SCHOOL_PLAN_RANK[schoolPlan] ?? -1) >= SCHOOL_PLAN_RANK[requiredPlan];
}

export function studentHasAI(
  studentPlan: string | null | undefined,
  requiredPlan: "free" | "basic" | "pro"
): boolean {
  if (!studentPlan) return false;
  return (STUDENT_AI_RANK[studentPlan] ?? -1) >= STUDENT_AI_RANK[requiredPlan];
}

export const FEATURE_REQUIREMENTS: Record<string, { school?: string; student?: string; label: string }> = {
  gradebook: { school: "starter", label: "Gradebook requires Starter plan" },
  attendance: { school: "starter", label: "Attendance requires Starter plan" },
  live_classes: { school: "growth", label: "Live Classes requires Growth plan" },
  analytics: { school: "growth", label: "Analytics requires Growth plan" },
  ai_grader: { school: "enterprise", label: "AI Grader requires Enterprise plan" },
  white_label: { school: "enterprise", label: "White Label requires Enterprise plan" },
  ai_chat: { student: "free", label: "AI Chat requires Free plan or above" },
  homework_helper: { student: "basic", label: "Homework Helper requires Basic AI plan" },
  exam_predictor: { student: "pro", label: "Exam Predictor requires Pro AI plan" },
  study_plan: { student: "pro", label: "Study Plan requires Pro AI plan" },
};