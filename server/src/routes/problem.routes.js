import { Router } from "express";
import * as pc from "../controllers/problem.controller.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const r = Router();

r.get("/", optionalAuth, pc.listProblems);
r.get("/:slug", pc.getProblem);
r.post("/:slug/run", requireAuth, pc.runSamples);
r.post("/:slug/submit", requireAuth, pc.submit);

export default r;
