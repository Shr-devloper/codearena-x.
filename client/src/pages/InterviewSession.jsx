import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import api from "../services/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import GradientButton from "../components/ui/GradientButton.jsx";

export default function InterviewSession() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [submitErr, setSubmitErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/interview/${sessionId}`);
        const s = data.session;
        if (s?.status === "complete") {
          nav(`/dashboard/interview/result/${sessionId}`, { replace: true });
          return;
        }
        setSession(s);
      } catch (e) {
        setLoadErr(e.response?.data?.error || "Not found");
      }
    })();
  }, [sessionId, nav]);

  async function onSend() {
    if (!String(answer).trim()) return;
    setSubmitting(true);
    setSubmitErr("");
    try {
      await api.post(`/interview/${sessionId}/complete`, { answer });
      nav(`/dashboard/interview/result/${sessionId}`);
    } catch (e) {
      setSubmitErr(e.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadErr && !session) {
    return (
      <div className="text-center text-rose-400">
        {loadErr}
        <div className="mt-4">
          <Link to="/dashboard/interview" className="text-violet-400">
            Back
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <Link
        to="/dashboard/interview"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-violet-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Setup
      </Link>
      <GlassCard>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/80">Question</p>
        <h2 className="mt-1 font-display text-lg font-semibold text-white">Role: {session.role}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{session.question}</p>
        {session.followUps?.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="mb-1 text-xs font-medium text-slate-500">If you want to go deeper</p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-slate-400">
              {session.followUps.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <label className="text-xs font-medium text-slate-400">Your answer</label>
        <textarea
          className="mt-2 min-h-[200px] w-full rounded-xl border border-white/10 bg-void-900/50 p-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-violet-500/30"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type what you’d say in the room — approach, tradeoffs, then details."
        />
        {submitErr && <p className="mt-2 text-sm text-rose-400">{submitErr}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <GradientButton type="button" onClick={onSend} disabled={submitting || !answer.trim()} className="!py-2.5 !pl-3 !pr-4 !text-sm">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Get feedback
          </GradientButton>
        </div>
        <p className="mt-2 text-[11px] text-slate-600">Uses one more guidance credit for feedback on your write-up.</p>
      </GlassCard>
    </div>
  );
}
