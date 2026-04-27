import { Router } from "express";
import * as c from "../controllers/interview.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/aiRateLimit.js";
import { requireAiCredit } from "../middleware/aiQuota.js";

const r = Router();

r.use(requireAuth);
r.use(aiLimiter);
r.post("/start", requireAiCredit, c.postStart);
r.post("/:id/complete", requireAiCredit, c.postComplete);
r.get("/:id", c.getOne);

export default r;
