import { isJudge0Configured } from "../config/env.js";
import * as problemService from "../services/problem.service.js";
import * as subService from "../services/submission.service.js";
import { Submission } from "../models/Submission.js";

function parseCodeAndLanguage(req) {
  const { code, language } = req.body || {};
  if (language == null || String(language).trim() === "") {
    return { err: { status: 400, error: "Pick a language first." } };
  }
  const c = code == null ? "" : String(code);
  if (c.trim() === "") {
    return {
      err: { status: 400, error: "Add your solution code, then run or submit. Whitespace alone doesn’t count." },
    };
  }
  return { code: c, language: String(language) };
}

/**
 * @param {Array<{ isHidden?: boolean }>} casesOrdered Same order as passed to runAllTests
 * @param {{ status: string, results?: Array<{ index: number, verdict: string, error?: string, runtimeMs?: number, memoryKb?: number }>, runtimeMs?: number, memoryKb?: number, failedIndex?: number }} out
 */
function buildJudgePayloadForClient(casesOrdered, out) {
  const results = (out.results || []).map((r) => {
    const tc = casesOrdered[r.index];
    const hidden = Boolean(tc?.isHidden);
    const row = {
      index: r.index,
      verdict: r.verdict,
      isHidden: hidden,
      runtimeMs: r.runtimeMs,
      memoryKb: r.memoryKb,
    };
    if (!hidden && r.actualOutput != null) {
      row.actualOutput = r.actualOutput;
    }
    if (r.verdict === "AC") return row;
    if (r.verdict === "CE" || !hidden) {
      row.error = r.error;
    } else {
      row.error = "Failed on a hidden test case";
    }
    return row;
  });

  return {
    status: out.status,
    results,
    passed: results.filter((x) => x.verdict === "AC").length,
    total: casesOrdered.length,
    runtimeMs: out.runtimeMs,
    memoryKb: out.memoryKb,
    failedIndex: out.failedIndex,
  };
}

export async function listProblems(req, res, next) {
  try {
    const tag = req.query.tag || req.query.domain;
    const difficulty = problemService.normalizeDifficulty(req.query.difficulty);
    if (req.query.difficulty != null && String(req.query.difficulty).trim() !== "" && difficulty == null) {
      return res.status(400).json({ error: "difficulty must be easy, medium, or hard" });
    }
    const rows = await problemService.listPublishedProblemsWithProgress(
      req.user?._id,
      { tag: tag || null, difficulty }
    );
    res.json({ problems: rows });
  } catch (e) {
    next(e);
  }
}

export async function getProblem(req, res, next) {
  try {
    const p = await problemService.getProblemBySlugForClient(req.params.slug);
    if (!p) {
      return res.status(404).json({ error: "Problem not found" });
    }
    res.json(p);
  } catch (e) {
    next(e);
  }
}

export async function runSamples(req, res, next) {
  try {
    if (!isJudge0Configured()) {
      return res.status(503).json({
        error:
          "Code running isn’t available: set JUDGE0_API_URL in server/.env (and key or RapidAPI host if your provider needs them), then restart the API.",
        code: "JUDGE0_UNAVAILABLE",
      });
    }
    const parsed = parseCodeAndLanguage(req);
    if (parsed.err) {
      return res.status(parsed.err.status).json({ error: parsed.err.error });
    }
    const { code, language } = parsed;
    const p = await problemService.getProblemBySlugForJudge(req.params.slug);
    if (!p) {
      return res.status(404).json({ error: "Problem not found" });
    }
    const samples = (p.testCases || []).filter((t) => !t.isHidden);
    if (!samples.length) {
      return res.status(400).json({ error: "No public sample cases" });
    }
    const out = await subService.runAllTests(code, language, samples);
    res.json({
      problemSlug: p.slug,
      mode: "sample",
      ...buildJudgePayloadForClient(samples, out),
    });
  } catch (e) {
    next(e);
  }
}

export async function submit(req, res, next) {
  try {
    if (!isJudge0Configured()) {
      return res.status(503).json({
        error:
          "Code running isn’t available: set JUDGE0_API_URL in server/.env (and key or RapidAPI host if your provider needs them), then restart the API.",
        code: "JUDGE0_UNAVAILABLE",
      });
    }
    const parsed = parseCodeAndLanguage(req);
    if (parsed.err) {
      return res.status(parsed.err.status).json({ error: parsed.err.error });
    }
    const { code, language } = parsed;
    const p = await problemService.getProblemBySlugForJudge(req.params.slug);
    if (!p) {
      return res.status(404).json({ error: "Problem not found" });
    }
    const all = [...(p.testCases || [])].sort(
      (a, b) => Number(a.isHidden) - Number(b.isHidden)
    );
    if (!all.length) {
      return res.status(400).json({ error: "No test cases" });
    }

    const out = await subService.runAllTests(code, language, all);
    const status = out.status;

    const last = out.results?.length ? out.results[out.results.length - 1] : null;
    const lastTc = last != null ? all[last.index] : null;
    let judgeMessage = last?.error ? last.error.slice(0, 2000) : null;
    if (
      last &&
      lastTc?.isHidden &&
      last.verdict !== "CE" &&
      last.verdict !== "AC"
    ) {
      judgeMessage = "Failed on a hidden test case";
    }

    const sub = await Submission.create({
      user: req.user._id,
      problem: p._id,
      language,
      code,
      status: status === "AC" ? "AC" : status,
      runtimeMs: out.runtimeMs,
      memoryKb: out.memoryKb,
      judgeMessage,
    });

    res.status(201).json({
      submission: sub,
      judge: buildJudgePayloadForClient(all, out),
    });
  } catch (e) {
    next(e);
  }
}
