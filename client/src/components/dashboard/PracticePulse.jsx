import { motion } from "framer-motion";
import { Activity, Trophy } from "lucide-react";

/**
 * Replaces static leaderboard: real per-user practice stats from the dashboard.
 */
export default function PracticePulse({ accepted = 0, totalSubmissions = 0, streak = 0, accuracy = 0 }) {
  const rows = [
    { label: "Accepted (AC)", value: String(accepted), sub: "unique passes" },
    { label: "Attempts logged", value: String(totalSubmissions), sub: "all verdicts" },
    { label: "Day streak", value: String(streak), sub: "consecutive" },
    { label: "Accuracy", value: `${accuracy}%`, sub: "AC / attempts" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Your practice pulse</h3>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-500">Live</span>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Pulled from your submissions — not a public leaderboard. Keep shipping attempts.
      </p>
      <ul className="space-y-2">
        {rows.map((row, i) => (
          <motion.li
            key={row.label}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 transition hover:border-violet-500/30"
          >
            <Activity className="h-3.5 w-3.5 shrink-0 text-cyan-400/60" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-slate-500">{row.label}</p>
              <p className="truncate text-sm font-medium text-slate-200 group-hover:text-white">{row.value}</p>
            </div>
            <span className="text-[10px] text-slate-600">{row.sub}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
