import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Code2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiErrorMessage } from "../services/api.js";

export default function Login() {
  const { login, setError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [params] = useSearchParams();
  const nav = useNavigate();

  useEffect(() => {
    const q = params.get("error");
    const msg = params.get("message");
    if (q === "oauth" || q === "session") {
      setErr(
        msg ||
          (q === "session"
            ? "Could not complete sign-in. Try again or use email and password."
            : "Sign-in was interrupted. Try again.")
      );
    }
  }, [params]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      nav("/dashboard", { replace: true });
    } catch (x) {
      setErr(getApiErrorMessage(x, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 flex items-center gap-2 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-glow-sm">
          <Code2 className="h-5 w-5" />
        </div>
        <span className="font-display text-lg font-bold">CodeArena X</span>
      </div>
      <motion.div
        className="glass-panel-strong w-full max-w-md p-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to your workspace.</p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-medium text-slate-400">Email</label>
            <input
              className="input mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Password</label>
            <input
              className="input mt-1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={submitting}
            />
          </div>
          {err && <p className="text-sm text-rose-400">{err}</p>}
          <motion.button
            type="submit"
            className="btn-primary w-full disabled:opacity-60"
            whileTap={{ scale: submitting ? 1 : 0.99 }}
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </motion.button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{" "}
          <Link className="font-medium text-violet-400 hover:text-violet-300" to="/register">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
