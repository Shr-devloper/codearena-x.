import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft,
  Brain,
  FlaskConical,
  Lightbulb,
  Loader2,
  MapPin,
  Play,
  ScanEye,
  Send,
  Sparkles,
} from "lucide-react";
import api from "../services/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import GradientButton from "../components/ui/GradientButton.jsx";
import ProblemGuidancePanel from "../components/problems/ProblemGuidancePanel.jsx";
import { LANGUAGES, getMonacoLanguage } from "../config/languages.js";

const defaultCode = (problem, lang) => problem?.starterCode?.[lang] || "";

function InsightBlock({ icon: Icon, eyebrow, title, children }) {
  if (children == null || children === "") return null;
  return (
    <div className="rounded-xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent p-4">
      {eyebrow ? (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-400/80">{eyebrow}</p>
      ) : null}
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-cyan-400/85" /> : null}
        {title}
      </h4>
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

export default function ProblemSolve() {
  const { slug } = useParams();
  const [problem, setProblem] = useState(null);
  const [lang, setLang] = useState("python");
  const [code, setCode] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [runOut, setRunOut] = useState(null);
  const [subOut, setSubOut] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mentorOut, setMentorOut] = useState(null);
  const [mentorLoading, setMentorLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/problems/${slug}`);
        setProblem(data);
        setCode(defaultCode(data, "python"));
      } catch (e) {
        setLoadErr(e.response?.data?.error || "Not found");
      }
    })();
  }, [slug]);

  const monacoLang = useMemo(() => getMonacoLanguage(lang), [lang]);

  const latestJudge = useMemo(() => {
    if (subOut?.judge && !subOut.error) return subOut.judge;
    if (runOut && !runOut.error && runOut.status != null) return runOut;
    return null;
  }, [subOut, runOut]);

  const canMentor =
    Boolean(latestJudge && latestJudge.status !== "AC" && code.trim().length > 0);

  function buildMentorContext() {
    if (!problem) return "";
    const parts = [problem.description];
    if (problem.inputFormat) parts.push(`Input format:\n${problem.inputFormat}`);
    if (problem.outputFormat) parts.push(`Output format:\n${problem.outputFormat}`);
    if (problem.constraints) parts.push(`Constraints:\n${problem.constraints}`);
    return parts.join("\n\n");
  }

  async function onSubmissionMentor() {
    if (!canMentor || !problem) return;
    setMentorOut(null);
    setMentorLoading(true);
    try {
      const failed = latestJudge.results?.find((r) => r.verdict !== "AC");
      const idx = failed?.index;
      let expectedOutput = "";
      let actualOutput = "";

      if (
        failed &&
        !failed.isHidden &&
        idx != null &&
        problem.sampleTestCases &&
        idx < problem.sampleTestCases.length
      ) {
        expectedOutput = problem.sampleTestCases[idx]?.expectedOutput ?? "";
      }
      if (failed?.actualOutput != null) {
        actualOutput = String(failed.actualOutput);
      }
      const judgeMessage = failed?.error || "";

      const { data } = await api.post("/ai/submission-mentor", {
        problemTitle: problem.title,
        problemDescription: buildMentorContext(),
        language: lang,
        code,
        verdict: latestJudge.status,
        ...(expectedOutput.trim() ? { expectedOutput } : {}),
        ...(actualOutput.trim() ? { actualOutput } : {}),
        ...(judgeMessage.trim() ? { judgeMessage } : {}),
      });
      setMentorOut(data);
    } catch (e) {
      setMentorOut({ error: e.response?.data?.error || e.message });
    } finally {
      setMentorLoading(false);
    }
  }

  const onLangChange = useCallback(
    (e) => {
      const v = e.target.value;
      setLang(v);
      if (problem) {
        setCode(problem.starterCode?.[v] || "");
      }
    },
    [problem]
  );

  async function onRun() {
    setRunOut(null);
    setRunning(true);
    try {
      const { data } = await api.post(`/problems/${slug}/run`, { code, language: lang });
      setRunOut(data);
    } catch (e) {
      setRunOut({
        error: e.response?.data?.error || e.message,
        code: e.response?.data?.code,
      });
    } finally {
      setRunning(false);
    }
  }

  async function onSubmit() {
    setSubOut(null);
    setSubmitting(true);
    try {
      const { data } = await api.post(`/problems/${slug}/submit`, { code, language: lang });
      setSubOut(data);
    } catch (e) {
      setSubOut({
        error: e.response?.data?.error || e.message,
        code: e.response?.data?.code,
        raw: e.response?.data,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadErr) {
    return (
      <div className="text-center text-rose-400">
        {loadErr}
        <div className="mt-4">
          <Link to="/dashboard/problems" className="text-violet-400">
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/dashboard/problems"
            className="mb-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-violet-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All problems
          </Link>
          <h1 className="font-display text-2xl font-bold text-white md:text-3xl">{problem.title}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {problem.tags?.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-400"
              >
                {t}
              </span>
            ))}
            <span className="rounded-full border border-violet-500/30 px-2 py-0.5 text-[11px] text-violet-200">
              {problem.difficulty}
            </span>
            {problem.hiddenTestCaseCount > 0 && (
              <span className="text-[11px] text-slate-500">
                +{problem.hiddenTestCaseCount} hidden cases on submit
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={lang}
            onChange={onLangChange}
            className="rounded-xl border border-white/10 bg-void-900/80 px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-violet-500/30"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <GradientButton
            onClick={onRun}
            disabled={running}
            className="!py-2.5 !pl-3 !pr-4 text-xs"
            type="button"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run (samples)
          </GradientButton>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/15 px-4 py-2.5 text-xs font-semibold text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <div
            className="prose prose-invert max-w-none text-sm text-slate-300 prose-headings:font-display prose-p:leading-relaxed"
            style={{ color: "rgb(203, 213, 225)" }}
          >
            {problem.description.split("\n").map((para, i) => (
              <p key={i} className="mb-3 whitespace-pre-wrap text-slate-300">
                {para}
              </p>
            ))}
          </div>
          {problem.inputFormat && (
            <div className="mt-4 border-t border-white/10 pt-4 text-xs text-slate-400">
              <p className="mb-1 font-semibold text-slate-200">Input</p>
              <pre className="whitespace-pre-wrap font-sans text-slate-400">{problem.inputFormat}</pre>
            </div>
          )}
          {problem.outputFormat && (
            <div className="mt-3 text-xs text-slate-400">
              <p className="mb-1 font-semibold text-slate-200">Output</p>
              <pre className="whitespace-pre-wrap font-sans text-slate-400">{problem.outputFormat}</pre>
            </div>
          )}
          {problem.constraints && (
            <div className="mt-3 text-xs text-slate-500">
              <p className="mb-1 font-semibold text-slate-300">Constraints</p>
              {problem.constraints}
            </div>
          )}
          {problem.hints?.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-200/90">
                <Sparkles className="h-3.5 w-3.5" />
                Nudges from the statement
              </p>
              <ol className="list-decimal space-y-1.5 pl-4 text-xs text-slate-400">
                {problem.hints.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ol>
            </div>
          )}
          {problem.sampleTestCases?.length > 0 && (
            <div className="mt-4 text-xs text-slate-500">
              <p className="mb-1 font-medium text-slate-300">Public samples (I/O shown — run tests these only)</p>
              {problem.sampleTestCases.map((tc, i) => (
                <div key={i} className="mb-2 font-mono text-[11px]">
                  <div className="text-slate-500">Sample {i + 1} in:</div>
                  <pre className="whitespace-pre-wrap text-slate-400">{tc.input}</pre>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <div className="flex min-h-[480px] flex-col">
          <div className="min-h-[360px] flex-1 overflow-hidden rounded-2xl border border-white/10">
            <Editor
              height="360px"
              language={monacoLang}
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                tabSize: 2,
              }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-500">Monaco: {monacoLang} · read stdin, write stdout</div>
        </div>
      </div>

      <ProblemGuidancePanel problem={problem} lang={lang} code={code} />

      <AnimatePresence>
        {runOut && !runOut.error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <GlassCard className="!p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-300/90">Run (samples)</h3>
              <p className="text-xs text-slate-500">Status: {runOut.status}</p>
              <ul className="mt-2 space-y-1 text-xs">
                {runOut.results?.map((r) => (
                  <li
                    key={r.index}
                    className="border-b border-white/5 py-1.5 font-mono text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <span>Case {r.index + 1}</span>
                      <span
                        className={
                          r.verdict === "AC" ? "text-emerald-400" : "text-rose-300"
                        }
                      >
                        {r.verdict}
                      </span>
                    </div>
                    {r.error && (
                      <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap text-[10px] text-rose-200/90">
                        {r.error}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>
        )}
        {runOut?.error && (
          <GlassCard className="!border-rose-500/25 !p-4">
            <p className="text-sm text-rose-200">{String(runOut.error)}</p>
            {runOut.code === "JUDGE0_UNAVAILABLE" && (
              <p className="mt-2 text-xs text-slate-500">
                Here’s what’s happening: the API doesn’t have a code runner host yet. Set `JUDGE0_API_URL` in `server/.env` and
                restart the server.
              </p>
            )}
          </GlassCard>
        )}
      </AnimatePresence>

      {subOut && !subOut.error && subOut.judge && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {subOut.judge.status === "AC" && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              All tests passed. This problem counts as <strong className="text-white">solved</strong> on your list and in chambers
              the next time you open them.
            </div>
          )}
          <GlassCard className="!p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-300/90">
              Submit (full suite)
            </h3>
            <p className="text-lg font-bold text-white">{subOut.judge.status}</p>
            <p className="text-xs text-slate-500">
              {subOut.judge.passed} / {subOut.judge.total} cases ·{" "}
              {subOut.judge.runtimeMs != null
                ? `${Number(subOut.judge.runtimeMs).toFixed(1)} ms (max of passed)`
                : "—"}{" "}
              · mem {subOut.judge.memoryKb != null ? `${subOut.judge.memoryKb} KB` : "—"}
            </p>
            {subOut.judge.failedIndex != null && (
              <p className="mt-1 text-[11px] text-amber-200/80">
                Stopped at case {subOut.judge.failedIndex + 1} (first failure).
              </p>
            )}
            <ul className="mt-3 space-y-1 text-xs">
              {subOut.judge.results?.map((r) => (
                <li
                  key={r.index}
                  className="border-b border-white/5 py-1.5 font-mono text-[11px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-400">
                      Case {r.index + 1}
                      {r.isHidden ? (
                        <span className="ml-1.5 text-slate-600">(hidden)</span>
                      ) : null}
                    </span>
                    <span
                      className={
                        r.verdict === "AC" ? "text-emerald-400" : "text-rose-300"
                      }
                    >
                      {r.verdict}
                    </span>
                  </div>
                  {r.error && (
                    <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap text-[10px] text-rose-200/90">
                      {r.error}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          </GlassCard>
        </motion.div>
      )}
      {subOut?.error && (
        <GlassCard className="!border-rose-500/25 !p-4">
          <p className="text-sm text-rose-200">{String(subOut.error)}</p>
          {subOut.code === "JUDGE0_UNAVAILABLE" && (
            <p className="mt-2 text-xs text-slate-500">
              Configure the code runner in `server/.env` (see project README) and try again.
            </p>
          )}
        </GlassCard>
      )}

      {canMentor && (
        <GlassCard className="!p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
            Want a second pair of eyes?
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            We’ll use your latest verdict ({latestJudge?.status}) and your current code. Counts toward
            your daily guidance allowance — you’ll get direction and framing, not a pasted solution.
          </p>
          <button
            type="button"
            onClick={onSubmissionMentor}
            disabled={mentorLoading}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-100/95 transition hover:bg-amber-500/20 disabled:opacity-50"
          >
            {mentorLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Lightbulb className="h-3.5 w-3.5" />
            )}
            {mentorLoading ? "Gathering insight…" : "Get insight"}
          </button>
        </GlassCard>
      )}

      {mentorOut && !mentorOut.error && (
        <GlassCard className="!p-4">
          <div className="mb-4 flex flex-col gap-1 border-b border-white/5 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/90">
              Insight
            </p>
            <h3 className="font-display text-lg font-semibold text-white">Let’s fix it together</h3>
            <p className="text-sm font-medium leading-snug text-slate-100">{mentorOut.error_summary}</p>
          </div>

          <div className="grid gap-3">
            <InsightBlock icon={ScanEye} eyebrow="Plain language" title="What’s happening">
              {mentorOut.detailed_explanation}
            </InsightBlock>
            <InsightBlock icon={MapPin} eyebrow="Pinpoint" title="Where it breaks">
              <p>
                <span className="text-slate-500">Nature of the gap: </span>
                {mentorOut.mistake_type}
              </p>
              <p className="mt-2">
                <span className="text-slate-500">Where to look: </span>
                {mentorOut.line_hint}
              </p>
            </InsightBlock>
            {(mentorOut.edge_cases_missed || []).length > 0 ? (
              <InsightBlock icon={FlaskConical} eyebrow="Stress tests" title="Things to consider">
                <ul className="list-disc space-y-2 pl-4">
                  {(mentorOut.edge_cases_missed || []).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </InsightBlock>
            ) : null}
            <InsightBlock icon={Brain} eyebrow="Framing" title="Think about this">
              {mentorOut.how_to_think}
            </InsightBlock>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-amber-200/75">
              Try this next
            </p>
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                <span className="font-medium text-amber-200/90">Need a small nudge? </span>
                {mentorOut.hint_level_1}
              </p>
              <p>
                <span className="font-medium text-amber-200/90">Want a stronger hint? </span>
                {mentorOut.hint_level_2}
              </p>
              <p>
                <span className="font-medium text-amber-200/90">Almost there — final direction. </span>
                {mentorOut.hint_level_3}
              </p>
            </div>
          </div>

          <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm leading-relaxed text-emerald-100/90">
            {mentorOut.encouragement}
          </p>
        </GlassCard>
      )}
      {mentorOut?.error && (
        <p className="text-sm text-rose-400">{String(mentorOut.error)}</p>
      )}
    </div>
  );
}
