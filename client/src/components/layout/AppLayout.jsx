import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sparkles,
  Sun,
  X,
  BookOpen,
  LayoutGrid,
  Mic2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import MentorHubPanel from "../guidance/MentorHubPanel.jsx";
import { cn } from "../../lib/cn.js";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/chambers", label: "Chambers", icon: LayoutGrid, end: false },
  { to: "/dashboard/problems", label: "All problems", icon: BookOpen, end: false },
  { to: "/dashboard/interview", label: "Mock interview", icon: Mic2, end: false },
  { to: "/dashboard/plan", label: "Plan & Pro", icon: Sparkles, end: false },
];

function linkClass({ isActive }) {
  return cn(
    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
    isActive
      ? "bg-white/10 text-white shadow-innerGlow"
      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);

  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-full">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-void-950/40 backdrop-blur-xl md:flex">
          <div className="border-b border-white/5 p-5">
            <Link to="/" className="group flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow-sm">
                <Code2 className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display font-bold text-white">CodeArena X</p>
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Mentor-led practice</p>
              </div>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass} end={item.end}>
                <item.icon className="h-4 w-4 text-violet-400/90" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-white/5 p-3 text-xs text-slate-500">
            <p className="truncate font-medium text-slate-400">{user?.name}</p>
            <p className="truncate">{user?.email}</p>
            <p className="mt-2 inline-flex rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
              {user?.plan === "pro" ? "Pro" : "Free"}
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-white/5 bg-void-950/60 px-3 backdrop-blur-xl md:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                className="btn-ghost p-2"
                aria-label="Menu"
                onClick={() => setMobile(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="font-display font-semibold text-white">CodeArena X</span>
            </div>
            <div className="hidden md:block" />
            <div className="flex items-center gap-1">
              <button type="button" onClick={toggle} className="btn-ghost p-2" aria-label="Theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                className="btn-ghost p-2"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          <AnimatePresence>
            {mobile && (
              <motion.div
                className="fixed inset-0 z-50 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  className="absolute inset-0 bg-black/70"
                  aria-label="Close menu"
                  onClick={() => setMobile(false)}
                />
                <motion.aside
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="absolute left-0 top-0 flex h-full w-[min(88vw,18rem)] flex-col border-r border-white/10 bg-void-950 shadow-glow"
                >
                  <div className="flex items-center justify-between border-b border-white/10 p-4">
                    <span className="font-display font-semibold text-white">Menu</span>
                    <button type="button" className="btn-ghost p-1" onClick={() => setMobile(false)}>
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <nav className="flex flex-col gap-1 p-3">
                    {nav.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobile(false)}
                        className={linkClass}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </NavLink>
                    ))}
                  </nav>
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.main
            className="relative flex-1 px-3 py-6 md:px-8 md:py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </motion.main>
        </div>
      </div>

      <MentorHubPanel />
    </div>
  );
}
