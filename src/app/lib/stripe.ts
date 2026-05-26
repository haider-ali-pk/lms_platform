import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export const PLAN_PRICES: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_ID_STARTER!,
  growth: process.env.STRIPE_PRICE_ID_GROWTH!,
  enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE!,
};

export const PLAN_AMOUNTS: Record<string, number> = {
  starter: 49,
  growth: 99,
  enterprise: 199,
};