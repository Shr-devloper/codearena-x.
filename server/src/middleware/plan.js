/**
 * Pro-only features (e.g. priority contests). Free users get 403.
 */
export function requireProPlan(req, res, next) {
  if (req.user?.plan !== "pro") {
    return res.status(403).json({
      error: "This feature requires a Pro plan",
      code: "PRO_REQUIRED",
    });
  }
  return next();
}
