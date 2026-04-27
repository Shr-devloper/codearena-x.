import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Loader2 } from "lucide-react";
import api from "../services/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import { iconForChamber } from "../config/chambers.js";

export default function ChambersHub() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/chambers");
        setRows(data.chambers || []);
      } catch (e) {
        setErr(e.response?.data?.error || "Could not load chambers");
      }
    })();
  }, []);

  if (err) return <p className="text-sm text-rose-400">{err}</p>;

  if (!rows.length && !err) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <motion.h1
          className="font-display text-3xl font-bold text-white md:text-4xl"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          DSA chambers
        </motion.h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Domain chambers (100-problem bank in progress). Tags place problems in one or more rooms —
          progress reflects unique ACs that carry each chamber tag.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((c, i) => {
          const Icon = iconForChamber(c.id);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={`/dashboard/chambers/${c.id}`} className="group block h-full">
                <GlassCard
                  className={`relative h-full overflow-hidden border bg-gradient-to-br from-white/[0.04] to-transparent transition duration-300 hover:-translate-y-0.5 ${c.border} ${c.glow}`}
                >
                  <div
                    className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${c.accent} opacity-25 blur-2xl transition duration-500 group-hover:opacity-40`}
                  />
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.accent} text-white shadow-lg`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-base font-semibold text-white group-hover:text-violet-100">
                        {c.title}
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{c.blurb}</p>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                          <span>
                            <span className="font-mono text-cyan-300/90">{c.solvedCount ?? 0}</span>
                            <span className="text-slate-600"> / </span>
                            <span className="font-mono text-slate-300">{c.problemCount}</span>
                            <span className="text-slate-600"> cleared</span>
                          </span>
                          <span className="font-mono text-violet-300/90">{c.progressPercent ?? 0}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${c.accent}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, c.progressPercent ?? 0)}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-violet-300" />
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
