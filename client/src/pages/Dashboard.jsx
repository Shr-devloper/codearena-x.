import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Brain, Flame, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import api from "../services/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import GradientButton from "../components/ui/GradientButton.jsx";
import ActivityHeatmap from "../components/dashboard/ActivityHeatmap.jsx";
import HireabilityMeter from "../components/dashboard/HireabilityMeter.jsx";
import SkillGraph from "../components/dashboard/SkillGraph.jsx";
import PracticePulse from "../components/dashboard/PracticePulse.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [weak, setWeak] = useState(null);
  const [loadingWeak, setLoadingWeak] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await api.get("/dashboard/summary");
        setData(d);
      } catch (e) {
        setErr(e.response?.data?.error || "Failed to load dashboard");
      }
    })();
  }, []);

  const weekly = useMemo(() => {
    if (!data?.heatmap?.length) return [];
    const h = data.heatmap;
    const weeks = Math.ceil(h.length / 7);
    const out = [];
    for (let w = 0; w < weeks; w++) {
      const slice = h.slice(w * 7, w * 7 + 7);
      const total = slice.reduce((a, b) => a + b.count, 0);
      out.push({ name: `W${w + 1}`, activity: total });
    }
    return out.slice(-12);
  }, [data]);

  async function runWeakness() {
    if (!data?.weaknessInput) return;
    setLoadingWeak(true);
    setWeak(null);
    setErr("");
    try {
      const { data: w } = await api.post("/ai/weakness", {
        recentSubmissionsSummary: data.weaknessInput.recentSubmissionsSummary,
        topicStats: data.weaknessInput.topicStats,
      });
      setWeak(w);
    } catch (e) {
      const code = e.response?.data?.code;
      if (code === "AI_PLAN_LIMIT") {
        setErr(
          "You’ve hit today’s guidance allowance on your plan. Upgrade to Pro for more room — or pick this up tomorrow."
        );
      } else {
        setErr(e.response?.data?.error || e.message);
      }
    } finally {
      setLoadingWeak(false);
    }
  }

  if (!data && !err) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Calibrating your dashboard…
      </div>
    );
  }

  if (err && !data) {
    return <p className="text-rose-400">{err}</p>;
  }

  const s = data.stats;
  const dna = data.skillDna;
  const pu = data.planUsage;
  const usagePct = pu
    ? Math.min(100, (pu.aiUsedToday / Math.max(1, pu.aiDailyLimit)) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <motion.h1
            className="font-display text-3xl font-bold text-white md:text-4xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Command center
          </motion.h1>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            A different kind of practice OS — signal over grind. Track DNA, compare to the field, and
            ship interviews with clarity.
          </p>
        </div>
        {user?.plan !== "pro" && (
          <Link
            to="/dashboard/plan"
            className="btn-primary inline-flex w-full shrink-0 justify-center sm:w-auto"
          >
            View Pro & limits
          </Link>
        )}
      </div>

      {pu && (
        <GlassCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>
              Guidance today: <strong className="text-white">{pu.aiUsedToday}</strong> / {pu.aiDailyLimit}
            </span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-slate-500">
              {pu.plan}
            </span>
          </div>
          <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-white/5 sm:mx-0">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${usagePct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </GlassCard>
      )}

      {err && data && (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{err}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <GlassCard strong className="grid gap-6 md:grid-cols-2">
            <HireabilityMeter
              score={s.hireability.score}
              tier={s.hireability.tier}
              sub="Composite of consistency, quality, and volume."
            />
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Skill field</h3>
              <SkillGraph topicPerformance={dna.topicPerformance} />
            </div>
          </GlassCard>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard strong>
            <PracticePulse
              accepted={s.accepted}
              totalSubmissions={s.totalSubmissions}
              streak={s.streak}
              accuracy={s.accuracy}
            />
          </GlassCard>
        </motion.div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Target}
          label="Hireability"
          value={s.hireability.score}
          sub={s.hireability.tier}
          delay={0}
        />
        <StatCard icon={Flame} label="Streak" value={s.streak} sub="consecutive days" delay={0.05} />
        <StatCard
          icon={TrendingUp}
          label="Acceptance"
          value={`${s.accuracy}%`}
          sub={`${s.accepted} / ${s.totalSubmissions}`}
          delay={0.1}
        />
        <StatCard
          icon={Brain}
          label="Confidence"
          value={dna?.confidence ?? "—"}
          sub="est. skill ceiling"
          delay={0.15}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="mb-1 font-display text-sm font-semibold text-white">Focus heatmap</h2>
          <p className="mb-4 text-xs text-slate-500">Submission density — reimagined in violet space.</p>
          <ActivityHeatmap days={data.heatmap} />
        </GlassCard>
        <GlassCard>
          <h2 className="mb-1 font-display text-sm font-semibold text-white">12-week consistency</h2>
          <p className="mb-3 text-xs text-slate-500">Submissions per week</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(148,163,184,0.7)", fontSize: 10 }} />
                <YAxis tick={{ fill: "rgba(148,163,184,0.7)", fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 20, 34, 0.95)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: 12,
                    color: "#e2e8f0",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="activity"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="mb-3 font-display text-sm font-semibold text-white">Topic DNA</h2>
          <ul className="space-y-2">
            {(dna.topicPerformance || []).map((t) => (
              <li
                key={t.tag}
                className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm transition hover:border-violet-500/20"
              >
                <span className="text-slate-300">{t.tag}</span>
                <span className="font-mono text-violet-300">{t.solved}</span>
              </li>
            ))}
            {!dna.topicPerformance?.length && (
              <li className="text-sm text-slate-500">Tag-backed solves will light this up.</li>
            )}
          </ul>
        </GlassCard>
        <GlassCard>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">Pattern insight</h2>
            <GradientButton className="py-2 text-xs" onClick={runWeakness} disabled={loadingWeak}>
              <Sparkles className="h-3.5 w-3.5" />
              {loadingWeak ? "…" : "Get insight"}
            </GradientButton>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Surfaces recurring gaps in how you attack problems — clearer after several honest attempts.
          </p>
          {weak && (
            <div className="space-y-2 text-sm text-slate-300">
              <p className="font-medium text-white">{weak.summary}</p>
              <ul className="list-disc space-y-1 pl-4">
                {(weak.patterns || []).map((p, i) => (
                  <li key={i}>
                    <span className="text-violet-300">{p.pattern}</span> — {p.evidence} ({p.severity})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard className="overflow-x-auto">
        <h2 className="mb-3 font-display text-sm font-semibold text-white">Recent attempts</h2>
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-slate-500">
              <th className="py-2 pr-4">Problem</th>
              <th className="py-2 pr-4">Verdict</th>
              <th className="py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {(data.recentSubmissions || []).map((r) => (
              <tr key={r._id} className="border-b border-white/5 last:border-0">
                <td className="py-3 pr-4 text-slate-200">{r.problem?.title || "—"}</td>
                <td className="py-3 pr-4 font-mono text-cyan-300/90">{r.status}</td>
                <td className="py-3 text-slate-500">
                  {r.createdAt && new Date(r.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {!data.recentSubmissions?.length && (
              <tr>
                <td colSpan={3} className="py-6 text-slate-500">
                  No attempts yet. Your timeline starts on first submit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="glass-panel group flex items-start gap-3 p-4 transition hover:border-violet-500/20">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/30 to-cyan-500/10 text-violet-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
          <p className="font-display text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-500">{sub}</p>
        </div>
      </div>
    </motion.div>
  );
}
