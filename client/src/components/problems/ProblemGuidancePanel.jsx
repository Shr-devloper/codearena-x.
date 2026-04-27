import { useEffect, useState, useCallback } from "react";
import { Lightbulb, BookOpen, ScanSearch, MessageCircle, Loader2 } from "lucide-react";
import api from "../../services/api.js";
import GlassCard from "../ui/GlassCard.jsx";
import GradientButton from "../ui/GradientButton.jsx";

/**
 * GROQ-backed guidance on the problem page (separate from post-submit mentor).
 */
export default function ProblemGuidancePanel({ problem, lang, code }) {
  const [health, setHealth] = useState(null);
  const [explain, setExplain] = useState(null);
  const [hint, setHint] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(null);
  const [err, setErr] = useState("");

  const canUseAi = health?.groq === "configured";

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/health");
        setHealth(data);
      } catch {
        setHealth({ groq: "unknown" });
      }
    })();
  }, []);

  const run = useCallback(
    async (kind, level) => {
      if (!canUseAi) {
        setErr("Add a GROQ API key in server/.env to use guidance on this page.");
        return;
      }
      if (kind !== "explain" && !String(code || "").trim()) {
        setErr("Write a bit of code first for hints and review — or use “Here’s the idea” for the problem itself.");
        return;
      }
      setErr("");
      setLoading(`${kind}${kind === "hint" ? level : ""}`);
      try {
        const desc = [
          problem?.description,
          problem?.inputFormat && `Input:\n${problem.inputFormat}`,
          problem?.outputFormat && `Output:\n${problem.outputFormat}`,
        ]
          .filter(Boolean)
          .join("\n\n");
        if (kind === "explain") {
          const { data } = await api.post("/ai/coach/explain", {
            problemTitle: problem?.title || "Problem",
            problemDescription: desc,
          });
          setExplain(data);
          setHint(null);
        } else if (kind === "hint") {
          const { data } = await api.post("/ai/coach/hint", {
            problemTitle: problem?.title || "Problem",
            problemDescription: desc,
            language: lang,
            code: code || "",
            level: level ?? 1,
          });
          setHint(data);
        } else if (kind === "review") {
          const { data } = await api.post("/ai/code-review", {
            problemTitle: problem?.title || "Problem",
            problemDescription: desc,
            language: lang,
            code: code || "",
          });
          setReview(data);
        }
      } catch (e) {
        const msg = e.response?.data?.error || e.message;
        if (e.response?.data?.code === "AI_PLAN_LIMIT") {
          setErr("You’ve hit today’s guidance limit for your plan. Try again tomorrow or check Plan & Pro.");
        } else {
          setErr(msg);
        }
      } finally {
        setLoading(null);
      }
    },
    [canUseAi, code, lang, problem]
  );

  return (
    <GlassCard className="!p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <MessageCircle className="h-4 w-4 text-cyan-400/80" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Guidance</h3>
        {!canUseAi && (
          <span className="text-[10px] text-amber-200/80">GROQ key not configured — guidance stays off</span>
        )}
      </div>
      {err && <p className="mb-2 text-sm text-rose-400">{err}</p>}

      <div className="flex flex-wrap gap-2">
        <GradientButton
          type="button"
          className="!py-2 !pl-2.5 !pr-3 !text-xs"
          disabled={!canUseAi || Boolean(loading)}
          onClick={() => run("explain")}
        >
          {loading === "explain" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookOpen className="h-3.5 w-3.5" />}
          Here’s the idea
        </GradientButton>
        <button
          type="button"
          disabled={!canUseAi || Boolean(loading)}
          onClick={() => run("hint", 1)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-100/95 disabled:opacity-50"
        >
          {loading === "hint1" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5" />}
          Nudge (1)
        </button>
        <button
          type="button"
          disabled={!canUseAi || Boolean(loading)}
          onClick={() => run("hint", 2)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/20 bg-white/5 px-3 py-2 text-xs text-slate-200 disabled:opacity-50"
        >
          {loading === "hint2" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Stronger nudge (2)
        </button>
        <button
          type="button"
          disabled={!canUseAi || Boolean(loading)}
          onClick={() => run("hint", 3)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/20 bg-white/5 px-3 py-2 text-xs text-slate-200 disabled:opacity-50"
        >
          {loading === "hint3" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Last nudge (3)
        </button>
        <button
          type="button"
          disabled={!canUseAi || Boolean(loading)}
          onClick={() => run("review")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100/90 disabled:opacity-50"
        >
          {loading === "review" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanSearch className="h-3.5 w-3.5" />}
          Review my code
        </button>
      </div>

      {explain && (
        <div className="mt-4 space-y-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-sm text-slate-200">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80">Insight</p>
          <p className="font-medium text-white">{explain.summary}</p>
          {explain.approach && <p className="text-slate-300">{explain.approach}</p>}
          {Array.isArray(explain.steps) && explain.steps.length > 0 && (
            <ol className="list-decimal space-y-1 pl-4 text-xs text-slate-400">
              {explain.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
        </div>
      )}

      {hint && (hint.hint || hint.nextStep) && (
        <div className="mt-3 space-y-2 rounded-xl border border-violet-500/25 bg-violet-500/5 p-3 text-sm text-slate-200">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/80">Try this next</p>
          {hint.hint && <p>{hint.hint}</p>}
          {hint.nextStep && <p className="text-xs text-slate-400">{hint.nextStep}</p>}
        </div>
      )}

      {review && (
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-slate-300">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">Review notes</p>
          {Array.isArray(review.suggestions) &&
            review.suggestions.map((s, i) => (
              <div key={i} className="border-b border-white/5 py-1 last:border-0">
                <p className="font-medium text-slate-200">{s.title}</p>
                <p className="text-slate-400">{s.approach}</p>
              </div>
            ))}
          {review.complexity && (
            <p className="text-slate-500">
              Complexity: {review.complexity.current} → aim for {review.complexity.optimal}
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}
