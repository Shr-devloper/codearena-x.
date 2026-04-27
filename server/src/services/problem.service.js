import { Problem } from "../models/Problem.js";
import { Submission } from "../models/Submission.js";
import { CHAMBERS } from "../config/chambers.js";
import { env } from "../config/env.js";

/** Accepts easy / Easy / MEDIUM → canonical enum value. */
export function normalizeDifficulty(d) {
  if (d == null || String(d).trim() === "") return null;
  const x = String(d).trim().toLowerCase();
  if (x === "easy" || x === "e") return "easy";
  if (x === "medium" || x === "med") return "medium";
  if (x === "hard" || x === "h") return "hard";
  return null;
}

export async function listPublishedProblems() {
  return Problem.find({ isPublished: true })
    .select("title slug difficulty tags createdAt")
    .sort({ title: 1 })
    .lean();
}

/** Global list with optional AC progress; optional `tag` and `difficulty` filters. */
export async function listPublishedProblemsWithProgress(userId, filters = {}) {
  const q = { isPublished: true };
  if (filters.tag) q.tags = filters.tag;
  if (filters.difficulty) q.difficulty = filters.difficulty;

  let rows = await Problem.find(q)
    .select("title slug difficulty tags createdAt")
    .sort({ title: 1 })
    .lean();

  if (env.NODE_ENV === "development") {
    console.log(
      `[CodeArena X] problem.service: listPublishedProblemsWithProgress → ${rows.length} rows (Atlas, db=${env.MONGODB_DB_NAME})`
    );
  }

  const diffRank = { easy: 0, medium: 1, hard: 2 };
  rows.sort(
    (a, b) =>
      (diffRank[a.difficulty] ?? 9) - (diffRank[b.difficulty] ?? 9) ||
      a.title.localeCompare(b.title)
  );

  if (!userId) {
    return rows.map((r) => ({ ...r, solved: false }));
  }
  const solvedIds = await Submission.distinct("problem", {
    user: userId,
    status: "AC",
  });
  const set = new Set(solvedIds.map(String));
  return rows.map((r) => ({ ...r, solved: set.has(String(r._id)) }));
}

/**
 * Chamber cards: counts per tag + optional solved counts (AC) for progress when userId set.
 */
export async function listChamberSummaries(userId) {
  const problems = await Problem.find({ isPublished: true })
    .select("_id tags")
    .lean();

  const countByTag = {};
  for (const p of problems) {
    for (const t of p.tags || []) {
      countByTag[t] = (countByTag[t] || 0) + 1;
    }
  }

  let solvedIds = new Set();
  if (userId) {
    const ids = await Submission.distinct("problem", {
      user: userId,
      status: "AC",
    });
    solvedIds = new Set(ids.map(String));
  }

  const solvedByTag = {};
  for (const p of problems) {
    if (!solvedIds.has(String(p._id))) continue;
    for (const t of p.tags || []) {
      solvedByTag[t] = (solvedByTag[t] || 0) + 1;
    }
  }

  return CHAMBERS.map((c) => {
    const total = countByTag[c.tag] ?? 0;
    const solved = userId ? (solvedByTag[c.tag] ?? 0) : 0;
    const progressPercent =
      userId && total > 0 ? Math.round((100 * solved) / total) : 0;
    return {
      id: c.id,
      tag: c.tag,
      title: c.title,
      blurb: c.blurb,
      accent: c.accent,
      border: c.border,
      glow: c.glow,
      problemCount: total,
      solvedCount: solved,
      progressPercent,
    };
  });
}

/**
 * Problems that include `chamberTag` in tags, with optional difficulty and solved filter.
 */
export async function listProblemsForChamber(chamberTag, { userId, difficulty, solvedFilter }) {
  const q = { isPublished: true, tags: chamberTag };
  if (difficulty) q.difficulty = difficulty;

  let rows = await Problem.find(q)
    .select("title slug difficulty tags createdAt")
    .sort({ title: 1 })
    .lean();

  const diffRank = { easy: 0, medium: 1, hard: 2 };
  rows.sort(
    (a, b) =>
      (diffRank[a.difficulty] ?? 9) - (diffRank[b.difficulty] ?? 9) ||
      a.title.localeCompare(b.title)
  );

  const solvedIds = await Submission.distinct("problem", {
    user: userId,
    status: "AC",
  });
  const solvedSet = new Set(solvedIds.map((id) => String(id)));

  rows = rows.map((r) => ({
    ...r,
    solved: solvedSet.has(String(r._id)),
  }));

  if (solvedFilter === "solved") rows = rows.filter((r) => r.solved);
  else if (solvedFilter === "unsolved") rows = rows.filter((r) => !r.solved);

  return rows;
}

/**
 * Public problem: include only non-hidden test inputs (no expected for hidden).
 */
export async function getProblemBySlugForClient(slug) {
  const p = await Problem.findOne({ slug, isPublished: true }).lean();
  if (env.NODE_ENV === "development" && p) {
    console.log(
      `[CodeArena X] problem.service: getProblemBySlugForClient: "${slug}" (Atlas, db=${env.MONGODB_DB_NAME})`
    );
  }
  if (!p) return null;

  const samples = (p.testCases || []).filter((t) => !t.isHidden);
  const hiddenCount = (p.testCases || []).filter((t) => t.isHidden).length;

  return {
    _id: p._id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    difficulty: p.difficulty,
    tags: p.tags,
    inputFormat: p.inputFormat,
    outputFormat: p.outputFormat,
    constraints: p.constraints,
    hints: p.hints,
    starterCode: p.starterCode,
    sampleTestCases: samples,
    hiddenTestCaseCount: hiddenCount,
  };
}

export async function getProblemBySlugForJudge(slug) {
  return Problem.findOne({ slug, isPublished: true }).lean();
}
