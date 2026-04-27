import { env } from "../config/env.js";
import { refundAiCredit } from "../services/plan.service.js";

export function notFoundHandler(req, res, next) {
  res.status(404).json({ error: "Not found", path: req.path });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message =
    status === 500 && env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  if (status >= 500) console.error(err);
  if (req?.aiCreditConsumed && status >= 500 && req.user?._id) {
    refundAiCredit(req.user._id).catch(() => {});
  }
  res.status(status).json({
    error: message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
