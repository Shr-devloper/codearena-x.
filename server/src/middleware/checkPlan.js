import { getPlanUsageState, getAiDailyLimit, getProblemsDailyLimit } from "../services/plan.service.js";

/**
 * Attaches `res.locals.planUsage` for downstream handlers.
 */
export async function attachPlanUsage(req, res, next) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    res.locals.planUsage = await getPlanUsageState(req.user._id);
    return next();
  } catch (e) {
    return next(e);
  }
}

/**
 * Responds 403 if the user is not on the Pro plan.
 * Use for routes that must be Pro-only (add sparingly; most limits use quotas instead).
 */
export function requirePro(req, res, next) {
  if (req.user?.plan !== "pro") {
    return res.status(403).json({
      error: "Pro plan required",
      code: "PRO_REQUIRED",
      currentPlan: req.user?.plan || "free",
    });
  }
  return next();
}

/**
 * @param {"ai" | "problems"} feature
 * @param {(usage: { plan: string, aiUsedToday: number, aiDailyLimit: number, problemsDailyLimit: number }) => boolean} check
 */
export function requirePlanLimit(feature, check) {
  return async (req, res, next) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const usage = await getPlanUsageState(req.user._id);
      if (!check(usage)) {
        return res.status(403).json({
          error: "Plan limit",
          code: "PLAN_LIMIT",
          feature,
          plan: usage.plan,
        });
      }
      return next();
    } catch (e) {
      return next(e);
    }
  };
}

export { getPlanUsageState, getAiDailyLimit, getProblemsDailyLimit };
