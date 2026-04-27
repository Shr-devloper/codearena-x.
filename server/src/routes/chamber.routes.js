import { Router } from "express";
import * as cc from "../controllers/chamber.controller.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const r = Router();

r.get("/", optionalAuth, cc.listChambers);
r.get("/:chamberId/problems", requireAuth, cc.listChamberProblems);

export default r;
