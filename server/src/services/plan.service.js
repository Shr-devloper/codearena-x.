import { User } from "../models/User.js";

const FREE_AI_DAILY = 25;
const PRO_AI_DAILY = 400;
const FREE_PROBLEMS_DAILY = 15;
const PRO_PROBLEMS_DAILY = 10_000;

export function getAiDailyLimit(plan) {
  return plan === "pro" ? PRO_AI_DAILY : FREE_AI_DAILY;
}

export function getProblemsDailyLimit(plan) {
  return plan === "pro" ? PRO_PROBLEMS_DAILY : FREE_PROBLEMS_DAILY;
}

export function utcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Resets per-day counters when the UTC day changes, returns current AI usage and limits.
 */
export async function getPlanUsageState(userId) {
  const user = await User.findById(userId).select("plan planActivatedAt aiUsageDate aiCallsToday");
  if (!user) return null;
  const key = utcDateKey();
  if (user.aiUsageDate !== key) {
    user.aiUsageDate = key;
    user.aiCallsToday = 0;
    await user.save();
  }
  const limit = getAiDailyLimit(user.plan);
  return {
    plan: user.plan,
    planActivatedAt: user.planActivatedAt,
    aiUsedToday: user.aiCallsToday,
    aiDailyLimit: limit,
    problemsDailyLimit: getProblemsDailyLimit(user.plan),
  };
}

/**
 * If under limit, increment AI usage and persist. Returns new counts or null if over limit.
 */
export async function consumeAiCredit(userId) {
  const key = utcDateKey();
  const user = await User.findById(userId).select("plan aiUsageDate aiCallsToday");
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  if (user.aiUsageDate !== key) {
    user.aiUsageDate = key;
    user.aiCallsToday = 0;
  }
  const limit = getAiDailyLimit(user.plan);
  if (user.aiCallsToday >= limit) {
    return { ok: false, plan: user.plan, used: user.aiCallsToday, limit };
  }
  user.aiCallsToday += 1;
  await user.save();
  return { ok: true, plan: user.plan, used: user.aiCallsToday, limit };
}

/**
 * Roll back one AI call when a downstream 5xx happens after a credit was already consumed.
 */
export async function refundAiCredit(userId) {
  if (!userId) return;
  const user = await User.findById(userId).select("aiUsageDate aiCallsToday");
  if (!user || user.aiCallsToday <= 0) return;
  user.aiCallsToday -= 1;
  await user.save();
}
