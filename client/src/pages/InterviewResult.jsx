import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import api from "../services/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";

export default function InterviewResult() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/interview/${sessionId}`);
        const s = data.session;
        if (s?.status !== "complete") {
          setErr("That session doesn’t have feedback yet.");
        }
        setSession(s);
      } catch (e) {
        setErr(e.response?.data?.error || "Not found");
      }
    })();
  }, [sessionId]);

  const fb = session?.feedback;

  if (err && !session) {
    return <p className="text-rose-400">{err}</p>;
  }
  if (!session) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <Link
        to="/dashboard/interview"
        className="mb-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-violet-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        New session
      </Link>

      <div className="flex items-center gap-2 text-emerald-300/90">
        <CheckCircle2 className="h-5 w-5" />
        <h1 className="font-display text-2xl font-bold text-white">Here’s your feedback</h1>
      </div>

      {err && <p className="text-amber-300/80">{err}</p>}

      <GlassCard>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">The prompt</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{session.question}</p>
        <p className="mt-3 text-[10px] text-slate-500">Your answer (saved on this run)</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-400">{session.answer}</p>
      </GlassCard>

      {fb && (
        <GlassCard>
          {fb.scores && (
            <div className="mb-4 flex flex-wrap gap-3 text-sm">
              {["correctness", "clarity", "depth"].map((k) => (
                <span
                  key={k}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-300"
                >
                  {k}: <strong className="text-white">{fb.scores[k]}</strong> / 10
                </span>
              ))}
            </div>
          )}
          {fb.feedback && (
            <div className="prose prose-invert max-w-none text-sm text-slate-200">
              <p className="whitespace-pre-wrap leading-relaxed">{fb.feedback}</p>
            </div>
          )}
          {Array.isArray(fb.improvements) && fb.improvements.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-4 text-sm text-slate-300">
              {fb.improvements.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          )}
        </GlassCard>
      )}

      <p className="text-center text-xs text-slate-600">
        Session id <span className="font-mono text-slate-500">{sessionId?.slice(0, 8)}…</span> stored on the server.
      </p>
    </div>
  );
}
