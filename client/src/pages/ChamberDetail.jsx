import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Filter,
  Loader2,
} from "lucide-react";
import api from "../services/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import { iconForChamber } from "../config/chambers.js";
import { cn } from "../lib/cn.js";

const diffStyle = {
  easy: "border-emerald-500/35 text-emerald-300",
  medium: "border-amber-500/35 text-amber-200",
  hard: "border-rose-500/35 text-rose-200",
};

export default function ChamberDetail() {
  const { chamberId } = useParams();
  const [payload, setPayload] = useState(null);
  const [err, setErr] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [solved, setSolved] = useState("all");
  const [loading, setLoading] = useState(true);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (difficulty) p.set("difficulty", difficulty);
    if (solved && solved !== "all") p.set("solved", solved);
    return p.toString();
  }, [difficulty, solved]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const url = qs
          ? `/chambers/${chamberId}/problems?${qs}`
          : `/chambers/${chamberId}/problems`;
        const { data } = await api.get(url);
        if (!cancelled) setPayload(data);
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.error || "Failed to load chamber");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chamberId, qs]);

  const Icon = iconForChamber(chamberId);

  if (err && !payload) {
    return (
      <div className="space-y-4">
        <p className="text-rose-400">{err}</p>
        <Link to="/dashboard/chambers" className="text-sm text-violet-400">
          ← All chambers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <Link
          to="/dashboard/chambers"
          className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-violet-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All chambers
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 text-white shadow-glow">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
                {payload?.chamber?.title || "Chamber"}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-slate-400">
                {payload?.chamber?.blurb}
              </p>
            </div>
          </div>
        </div>
      </div>

      <GlassCard className="!p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="rounded-xl border border-white/10 bg-void-900/80 px-3 py-2 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-violet-500/30"
            >
              <option value="">All difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              value={solved}
              onChange={(e) => setSolved(e.target.value)}
              className="rounded-xl border border-white/10 bg-void-900/80 px-3 py-2 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-violet-500/30"
            >
              <option value="all">All attempts</option>
              <option value="solved">Solved (AC)</option>
              <option value="unsolved">Not solved yet</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {loading && (
        <div className="flex justify-center py-16 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      )}

      {!loading && payload && (
        <div className="grid gap-3 md:grid-cols-2">
          {(payload.problems || []).map((p, i) => (
            <motion.div
              key={p.slug}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Link to={`/dashboard/problems/${p.slug}`} className="group block">
                <GlassCard className="h-full transition hover:border-violet-500/35 hover:shadow-glow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {p.solved ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-slate-600" />
                        )}
                        <h2 className="font-display text-sm font-semibold text-white group-hover:text-violet-200">
                          {p.title}
                        </h2>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(p.tags || []).slice(0, 5).map((t) => (
                          <span
                            key={t}
                            className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase",
                        diffStyle[p.difficulty] || ""
                      )}
                    >
                      {p.difficulty}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-violet-300/80">
                    Open problem
                    <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
          {!payload.problems?.length && (
            <p className="text-sm text-slate-500 md:col-span-2">
              No problems match these filters in this chamber.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
