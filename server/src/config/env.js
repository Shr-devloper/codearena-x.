import dotenv from "dotenv";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, "../../.env");
const serverEnv = path.resolve(__dirname, "../.env");

if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
else if (fs.existsSync(serverEnv)) dotenv.config({ path: serverEnv });
else dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z
    .string()
    .url()
    .default("http://localhost:5173")
    .transform((s) => {
      try {
        return new URL(s.trim()).origin;
      } catch {
        return "https://codearena-x.vercel.app";
      }
    }),
  /**
   * Extra browser origins for CORS (comma-separated). Each value is normalized to scheme+host+port (exact match, no path).
   * Use when the app is served from multiple origins (e.g. production Vercel + local dev hitting the same API).
   */
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((s) => (s == null || !String(s).trim() ? undefined : String(s).trim())),
  MONGODB_URI: z.string().min(1),
  /** Default namespace for all collections (e.g. problems, users, submissions). */
  MONGODB_DB_NAME: z
    .string()
    .optional()
    .transform((s) => (s && s.trim() ? s.trim() : "codearena_x")),
  /**
   * For mongodb+srv:// URLs, use public resolvers (8.8.8.8, 1.1.1.1) before connecting.
   * Fixes `querySrv ECONNREFUSED` on Windows when the stub resolver (127.0.0.1) fails SRV lookup.
   */
  MONGODB_USE_PUBLIC_DNS: z
    .string()
    .default("true")
    .transform((s) => {
      const t = s.trim().toLowerCase();
      return t !== "0" && t !== "false" && t !== "no" && t !== "off";
    }),
  /**
   * Optional `mongodb://` seed list from Atlas (Connect → choose older driver or “Standard connection”),
   * used if the SRV connection still fails. Leave unset if not needed.
   */
  MONGODB_DIRECT_URI: z
    .string()
    .optional()
    .transform((s) => (s && s.trim() ? s.trim() : undefined)),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  JUDGE0_API_URL: z.string().optional(),
  JUDGE0_API_KEY: z.string().optional(),
  /** e.g. judge0-ce.p.rapidapi.com when using RapidAPI */
  JUDGE0_RAPIDAPI_HOST: z.string().optional(),
  /** Per-test-case ceiling while polling Judge0 (wait=false). */
  JUDGE0_MAX_WAIT_MS: z.coerce.number().default(120_000),
  JUDGE0_POLL_MS: z.coerce.number().default(350),
  /** Razorpay (test: rzp_test_…). Both required to enable real checkout. */
  RAZORPAY_KEY_ID: z
    .string()
    .optional()
    .transform((s) => (s && s.trim() ? s.trim() : undefined)),
  RAZORPAY_KEY_SECRET: z
    .string()
    .optional()
    .transform((s) => (s && s.trim() ? s.trim() : undefined)),
  /** Amount in paise, e.g. 19900 = ₹199 */
  RAZORPAY_PRO_AMOUNT_PAISE: z.coerce.number().default(19900),
  RAZORPAY_CURRENCY: z.string().default("INR"),
  /** Set true only for local dev if you need POST /payment/upgrade without Razorpay. */
  PAYMENT_ALLOW_SIMULATED_UPGRADE: z
    .string()
    .default("false")
    .transform((s) => {
      const t = s.trim().toLowerCase();
      return t === "1" || t === "true" || t === "yes";
    }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

function normalizeOriginInput(raw) {
  if (raw == null || !String(raw).trim()) return null;
  try {
    return new URL(String(raw).trim()).origin;
  } catch {
    return null;
  }
}

/** Exact browser `Origin` values allowed for `cors` + Socket.IO with `credentials: true` (no wildcard). */
export const corsAllowedOrigins = (() => {
  const set = new Set();
  const push = (v) => {
    const n = normalizeOriginInput(v);
    if (n) set.add(n);
  };
  push(env.CLIENT_URL);
  if (env.CORS_ORIGINS) {
    for (const part of env.CORS_ORIGINS.split(",")) {
      push(part);
    }
  }
  if (env.NODE_ENV === "development") {
    push("http://localhost:5173");
  }
  return [...set];
})();

if (env.NODE_ENV === "development") {
  console.info("[CORS] Allowed origins:", corsAllowedOrigins.join(", "));
}

export function isGroqConfigured() {
  return Boolean(env.GROQ_API_KEY && env.GROQ_API_KEY.length > 0);
}

export function isGoogleOAuthConfigured() {
  return Boolean(
    env.GOOGLE_CLIENT_ID &&
      env.GOOGLE_CLIENT_SECRET &&
      env.GOOGLE_CALLBACK_URL
  );
}

export function isJudge0Configured() {
  const u = env.JUDGE0_API_URL;
  return Boolean(u && String(u).trim().length > 0);
}

export function isRazorpayConfigured() {
  return Boolean(
    env.RAZORPAY_KEY_ID &&
      env.RAZORPAY_KEY_ID.length > 0 &&
      env.RAZORPAY_KEY_SECRET &&
      env.RAZORPAY_KEY_SECRET.length > 0
  );
}
