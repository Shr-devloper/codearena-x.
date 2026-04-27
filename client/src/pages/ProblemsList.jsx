import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Circle, Code2 } from "lucide-react";
import api from "../services/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";

const diffStyle = {
  easy: "border-emerald-500/30 text-emerald-300",
  medium: "border-amber-500/30 text-amber-200",
  hard: "border-rose-500/30 text-rose-200",
};

export default function ProblemsList() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/problems");
        setRows(data.problems || []);
      } catch (e) {
        setErr(e.response?.data?.error || "Failed to load");
      }
    })();
  }, []);

  if (err) {
    return <p className="text-rose-400">{err}</p>;
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">All problems</h1>
        <p className="mt-1 text-sm text-slate-400">
          Full bank (every tag). Prefer{" "}
          <Link to="/dashboard/chambers" className="text-violet-300 hover:underline">
            DSA chambers
          </Link>{" "}
          for domain-first practice.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((p, i) => (
          <motion.div
            key={p.slug}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
          >
            <Link to={`/dashboard/problems/${p.slug}`} className="block group">
              <GlassCard className="transition hover:border-violet-500/30 hover:shadow-glow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {p.solved ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-slate-600" />
                      )}
                      <Code2 className="h-4 w-4 shrink-0 text-violet-400" />
                      <h2 className="font-display text-base font-semibold text-white group-hover:text-violet-200">
                        {p.title}
                      </h2>
                    </div>
                    <p className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                      {(p.tags || []).slice(0, 4).map((t) => (
                        <span key={t} className="rounded border border-white/5 px-1.5 py-0.5">
                          {t}
                        </span>
                      ))}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase ${diffStyle[p.difficulty] || ""}`}
                  >
                    {p.difficulty}
                  </span>
                </div>
                <div className="mt-3 flex items-center text-xs text-violet-300/80">
                  Open
                  <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
        {!rows.length && (
          <p className="text-sm text-slate-500">No problems yet. Run the seed script on the server.</p>
        )}
      </div>
    </div>
  );
}
