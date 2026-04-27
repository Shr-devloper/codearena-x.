import { motion } from "framer-motion";

const R = 52;
const C = 2 * Math.PI * R;

export default function HireabilityMeter({ score = 0, tier = "", sub = "" }) {
  const pct = Math.min(100, Math.max(0, score));
  const offset = C - (pct / 100) * C;

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative h-36 w-36">
        <svg className="-rotate-90 transform" width="144" height="144" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="hireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="60" cy="60" r={R} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
          <motion.circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="url(#hireGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            filter="url(#glow)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            className="font-display text-3xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            {Math.round(pct)}
          </motion.span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">Hireability</span>
        </div>
      </div>
      <p className="text-center font-medium text-accent-violet">{tier}</p>
      {sub && <p className="text-center text-xs text-slate-500 max-w-xs">{sub}</p>}
    </div>
  );
}
