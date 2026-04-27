import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Crown, LineChart, Shield, Sparkles, Zap, CreditCard, AlertCircle } from "lucide-react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import RazorpayCheckoutModal from "../components/payment/RazorpayCheckoutModal.jsx";
import { cn } from "../lib/cn.js";

const FEATURES = {
  free: [
    { icon: Zap, text: "25 guided sessions / day (coach, review, and insight)" },
    { icon: LineChart, text: "Core dashboard, heatmap, skill radar" },
    { icon: Shield, text: "Email + Google sign-in" },
  ],
  pro: [
    { icon: Sparkles, text: "400 guided sessions / day" },
    { icon: Crown, text: "Pro limits for deep review and room to iterate" },
    { icon: LineChart, text: "Patterns, roadmaps, and long-form practice without hitting the cap" },
  ],
};

export default function Plan() {
  const { user, refreshUser } = useAuth();
  const [billing, setBilling] = useState(null);
  const [health, setHealth] = useState(null);
  const [modal, setModal] = useState(false);
  const [upgradeCelebration, setUpgradeCelebration] = useState(false);
  const [err, setErr] = useState("");

  const isPro = user?.plan === "pro";
  const razorpayReady = health?.razorpay === "configured";

  const load = useCallback(async () => {
    const [b, h] = await Promise.all([
      api.get("/payment/billing").catch(() => null),
      api.get("/health").catch(() => null),
    ]);
    if (b) setBilling(b.data);
    if (h) setHealth(h.data);
  }, []);

  useEffect(() => {
    load();
  }, [load, user?.plan]);

  const onRazorpaySuccess = useCallback(
    async () => {
      setModal(false);
      setErr("");
      setUpgradeCelebration(true);
      await refreshUser();
      await load();
      window.setTimeout(() => setUpgradeCelebration(false), 3200);
    },
    [load, refreshUser]
  );

  return (
    <div className="space-y-10 pb-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Plan & billing</h1>
        <p className="mt-1 text-sm text-slate-400">
          Pro is unlocked through <span className="text-violet-300">Razorpay</span> (test keys in development). The server
          verifies every payment — we never trust the browser alone.
        </p>
        {err && <p className="mt-2 text-sm text-rose-400">{err}</p>}
      </div>

      {health && !razorpayReady && (
        <div className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <p className="font-medium text-white">Razorpay is not configured on the API</p>
            <p className="mt-1 text-xs text-amber-200/80">
              Set <code className="rounded bg-black/20 px-1">RAZORPAY_KEY_ID</code> and{" "}
              <code className="rounded bg-black/20 px-1">RAZORPAY_KEY_SECRET</code> in <code className="rounded bg-black/20 px-1">server/.env</code>{" "}
              (use <code className="rounded bg-black/20 px-1">rzp_test_…</code> for test mode), then restart the server.
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {upgradeCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 px-5 py-4 text-center shadow-glow"
          >
            <p className="text-sm font-medium text-emerald-100">
              You’re on <strong className="text-white">Pro</strong> — limits are live. Here’s what’s next: pick a hard problem
              and use the extra guidance room.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard
          className={cn(
            "relative border transition",
            !isPro ? "border-violet-500/25 ring-1 ring-violet-500/20" : "border-white/5"
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Free</h2>
            {!isPro && (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">Current</span>
            )}
          </div>
          <ul className="space-y-3">
            {FEATURES.free.map((f) => (
              <li key={f.text} className="flex gap-2 text-sm text-slate-300">
                <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                {f.text}
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard
          className={cn("relative overflow-hidden", isPro && "border border-violet-500/30 shadow-glow")}
        >
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="relative mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Pro</h2>
            {isPro ? (
              <span className="rounded-full border border-violet-500/40 bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">
                Active
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setErr("");
                  if (!razorpayReady) return;
                  setModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!razorpayReady}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Pay ₹199 / mo
              </button>
            )}
          </div>
          <p className="relative mb-3 text-2xl font-bold text-white">
            ₹199 <span className="text-sm font-normal text-slate-500">INR</span>
          </p>
          <ul className="relative space-y-3">
            {FEATURES.pro.map((f) => (
              <li key={f.text} className="flex gap-2 text-sm text-slate-200">
                <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                {f.text}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      {billing && (
        <GlassCard>
          <h3 className="mb-1 font-display text-base font-semibold text-white">Billing history</h3>
          <p className="mb-4 text-xs text-slate-500">
            {billing.razorpay
              ? "Your latest Pro charge appears below. Older rows are sample placeholders for the UI."
              : "No Razorpay charge on file yet — sample line items are shown for layout."}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-2">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {billing.invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 pr-4 text-slate-400">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 text-slate-200">{inv.description}</td>
                    <td className="py-3 pr-2 font-mono text-slate-300">
                      {inv.currency === "INR" ? "₹" : "$"}
                      {inv.amount} {inv.currency}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                        <Check className="h-3 w-3" />
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <RazorpayCheckoutModal
        open={modal}
        onClose={() => {
          setModal(false);
          setErr("");
        }}
        userName={user?.name}
        userEmail={user?.email}
        onSuccess={onRazorpaySuccess}
        onError={(msg) => setErr(msg)}
      />
    </div>
  );
}
