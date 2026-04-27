import { Router } from "express";
import passport from "passport";
import * as auth from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { authLoginLimiter, authRegisterLimiter } from "../middleware/authRateLimit.js";
import { env, isGoogleOAuthConfigured } from "../config/env.js";
import { signAccessToken } from "../utils/token.js";

const r = Router();

r.post("/register", authRegisterLimiter, auth.register);
r.post("/login", authLoginLimiter, auth.login);
r.get("/me", requireAuth, auth.me);

if (isGoogleOAuthConfigured()) {
  r.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  r.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${env.CLIENT_URL}/login?error=oauth`,
    }),
    (req, res) => {
      const token = signAccessToken(req.user._id.toString());
      const url = new URL("/auth/callback", env.CLIENT_URL);
      url.searchParams.set("token", token);
      res.redirect(url.toString());
    }
  );
}

export default r;
