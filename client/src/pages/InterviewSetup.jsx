import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Mic2 } from "lucide-react";
import api from "../services/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import GradientButton from "../components/ui/GradientButton.jsx";

const ROLES = [
  { id: "backend", label: "Backend (APIs, SQL)" },
  { id: "frontend", label: "Frontend (React, UX)" },
  { id: "swe", label: "Software engineering (general)" },
  { id: "intern", label: "Intern / new grad" },
];

export default function InterviewSetup() {
  const [role, setRole] = useState("Software engineering (general practice)");
  const [duration, setDuration] = useState(30);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function onStart() {
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.post("/interview/start", { role, durationMinutes: duration });
      nav(`/dashboard/interview/session/${data.id}`);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <Link
        to="/dashboard"
        className="mb-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-violet-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Overview
      </Link>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
          <Mic2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Mock interview</h1>
          <p className="text-sm text-slate-500">You’ll get one real question, then written feedback on your answer.</p>
        </div>
      </div>

      <GlassCard>
        {err && <p className="mb-3 text-sm text-rose-400">{err}</p>}
        <label className="block text-xs font-medium text-slate-400">What role are you preparing for?</label>
        <p className="mb-2 text-[11px] text-slate-600">Pick a label or type your own in the box.</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {ROLES.map((r) => (
            <button
              type="button"
              key={r.id}
              onClick={() => setRole(r.label)}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 hover:border-violet-500/40"
            >
              {r.label}
            </button>
          ))}
        </div>
        <input
          className="mb-4 w-full rounded-xl border border-white/10 bg-void-900/50 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/30"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />

        <label className="block text-xs font-medium text-slate-400">How long is this block?</label>
        <p className="mb-1 text-[11px] text-slate-600">We shape the question to fit (5–90 minutes).</p>
        <input
          type="range"
          min={5}
          max={90}
          step={5}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full"
        />
        <p className="mb-4 text-sm text-slate-300">
          {duration} minutes
        </p>

        <GradientButton type="button" onClick={onStart} className="w-full justify-center" disabled={loading || !role.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Start session
        </GradientButton>
        <p className="mt-3 text-center text-[11px] text-slate-600">
          Uses your daily guidance allowance (same as hints on problems).
        </p>
      </GlassCard>
    </div>
  );
}
