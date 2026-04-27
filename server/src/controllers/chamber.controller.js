import { chamberById } from "../config/chambers.js";
import * as problemService from "../services/problem.service.js";

export async function listChambers(req, res, next) {
  try {
    const chambers = await problemService.listChamberSummaries(req.user?._id);
    res.json({ chambers });
  } catch (e) {
    next(e);
  }
}

export async function listChamberProblems(req, res, next) {
  try {
    const chamber = chamberById(req.params.chamberId);
    if (!chamber) {
      return res.status(404).json({ error: "Chamber not found" });
    }
    const difficulty = req.query.difficulty;
    const solved = req.query.solved || "all";
    if (!["all", "solved", "unsolved"].includes(solved)) {
      return res.status(400).json({ error: "solved must be all, solved, or unsolved" });
    }
    if (difficulty && !["easy", "medium", "hard"].includes(difficulty)) {
      return res.status(400).json({ error: "invalid difficulty" });
    }
    const problems = await problemService.listProblemsForChamber(chamber.tag, {
      userId: req.user._id,
      difficulty: difficulty || null,
      solvedFilter: solved,
    });
    res.json({
      chamber: {
        id: chamber.id,
        tag: chamber.tag,
        title: chamber.title,
        blurb: chamber.blurb,
      },
      problems,
    });
  } catch (e) {
    next(e);
  }
}
