import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as dash from "../controllers/dashboard.controller.js";

const r = Router();

r.get("/summary", requireAuth, dash.getSummary);

export default r;
