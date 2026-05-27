import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia" as any,
});

export const SCHOOL_PLAN_PRICES: Record<string, string> = {
  trial: process.env.STRIPE_SCHOOL_PRICE_TRIAL!,
  starter: process.env.STRIPE_SCHOOL_PRICE_STARTER!,
  growth: process.env.STRIPE_SCHOOL_PRICE_GROWTH!,
  enterprise: process.env.STRIPE_SCHOOL_PRICE_ENTERPRISE!,
};

export const SCHOOL_PLAN_AMOUNTS: Record<string, number> = {
  trial: 0,
  starter: 149,
  growth: 499,
  enterprise: 999,
};

export const SCHOOL_PLAN_SEATS: Record<string, number> = {
  trial: 30,
  starter: 100,
  growth: 500,
  enterprise: 999999,
};

export const SCHOOL_PLAN_TEACHERS: Record<string, number> = {
  trial: 2,
  starter: 10,
  growth: 50,
  enterprise: 999999,
};

export const SCHOOL_SPONSORED_AI: Record<string, string> = {
  trial: "none",
  starter: "free",
  growth: "basic",
  enterprise: "pro",
};

export const STUDENT_PLAN_PRICES: Record<string, string> = {
  basic: process.env.STRIPE_STUDENT_PRICE_BASIC!,
  pro: process.env.STRIPE_STUDENT_PRICE_PRO!,
  booster: process.env.STRIPE_STUDENT_PRICE_BOOSTER!,
};

export const STUDENT_PLAN_LIMITS: Record<string, number> = {
  free: 10,
  basic: 200,
  pro: 999999,
  booster: 500,
};