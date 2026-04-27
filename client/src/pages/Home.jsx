import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Orbit, Sparkles, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user, ready } = useAuth();

  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-full max-w-5xl flex-col justify-center px-4 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200/90">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Placement intelligence, re-architected
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl md:text-7xl">
            Master interviews.
            <span className="mt-1 block text-gradient">Not the leaderboard aesthetic.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
            A premium arena for code practice, human-grade mentorship cues, and hireability signal —
            built for people who want a serious tool, not a dated contest site.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {ready && user ? (
              <Link to="/dashboard" className="btn-primary px-7 py-3 text-base">
                Enter command center
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary px-7 py-3 text-base">
                  Start free
                  <Zap className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-slate-200 transition hover:border-violet-500/30 hover:bg-white/5"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          className="mt-20 grid gap-4 sm:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {[
            { icon: Orbit, t: "Skill DNA", d: "Topic radar + how your attempts cluster over time." },
            { icon: Sparkles, t: "Guided practice", d: "Structured review and hints — paced by your plan." },
            { icon: ArrowRight, t: "Hireability", d: "Signal designed for how hiring actually works." },
          ].map((x) => (
            <motion.div
              key={x.t}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0 },
              }}
              className="glass-panel rounded-2xl p-4 text-left"
            >
              <x.icon className="mb-2 h-5 w-5 text-cyan-400" />
              <h3 className="font-display text-sm font-semibold text-white">{x.t}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{x.d}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
