import { consumeAiCredit } from "../services/plan.service.js";

/**
 * Deducts one AI credit before handler runs. On failure, returns 403 with upgrade hint.
 */
export async function requireAiCredit(req, res, next) {
  try {
    const result = await consumeAiCredit(req.user._id);
    if (!result.ok) {
      return res.status(403).json({
        error: "Daily guidance limit reached for your plan",
        code: "AI_PLAN_LIMIT",
        plan: result.plan,
        used: result.used,
        limit: result.limit,
        upgrade: "/api/payment/upgrade",
      });
    }
    req.aiCreditConsumed = true;
    res.locals.aiQuota = { used: result.used, limit: result.limit, plan: result.plan };
    return next();
  } catch (e) {
    return next(e);
  }
}
