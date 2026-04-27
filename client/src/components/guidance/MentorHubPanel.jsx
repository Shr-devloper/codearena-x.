import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, X, BarChart2, Sparkles, Route } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Quick navigation to mentorship surfaces — structured panel, not a chat.
 */
export default function MentorHubPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2 md:bottom-8 md:right-8">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="glass-panel-strong w-[min(100vw-2rem,20rem)] overflow-hidden p-0 shadow-glow"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-indigo-600/20 to-cyan-500/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Guidance hub</p>
                  <p className="text-[10px] text-slate-400">Your mentorship shortcuts</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost p-1.5" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto p-3 text-sm text-slate-300">
              <p className="text-xs leading-relaxed text-slate-400">
                Shortcuts to the same places you’d go in a real round: your numbers, your plan, and what
                to tackle next after a few real attempts.
              </p>
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2.5 text-left transition hover:border-violet-500/30 hover:bg-violet-500/10"
              >
                <BarChart2 className="h-4 w-4 text-violet-400" />
                <span>Command center — skill DNA & hireability</span>
              </Link>
              <Link
                to="/dashboard/plan"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2.5 text-left transition hover:border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <span>Plan & limits — guidance allowance</span>
              </Link>
              <div className="flex items-start gap-2 rounded-lg border border-dashed border-white/10 p-2 text-xs text-slate-500">
                <Route className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span>
                  After a few real attempts, open <strong className="font-medium text-slate-400">Pattern insight</strong>{" "}
                  on the dashboard — it reads much clearer with history behind it.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 text-white shadow-glow"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        aria-label="Open guidance hub"
        aria-expanded={open}
      >
        <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 transition group-hover:opacity-100" />
        <Compass className="relative h-7 w-7" />
      </motion.button>
    </div>
  );
}
