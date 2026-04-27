import rateLimit from "express-rate-limit";

/** Limit brute-force on login (per IP + global window). */
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Wait a few minutes and try again." },
});

export const authRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many accounts created from this network. Try again later." },
});
