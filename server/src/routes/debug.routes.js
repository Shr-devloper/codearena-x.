import { Router } from "express";
import { Problem } from "../models/Problem.js";
import { env } from "../config/env.js";

const r = Router();

/**
 * GET /api/debug/problems — total count + one sample document (no auth; use only in trusted dev).
 */
r.get("/problems", async (req, res, next) => {
  try {
    const total = await Problem.countDocuments();
    const sample = await Problem.findOne().select("title slug difficulty").lean();
    res.json({
      database: env.MONGODB_DB_NAME,
      collection: "problems",
      total,
      sample: sample || null,
    });
  } catch (e) {
    next(e);
  }
});

export default r;
