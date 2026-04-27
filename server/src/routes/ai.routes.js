import { Router } from "express";
import * as ai from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/aiRateLimit.js";
import { requireAiCredit } from "../middleware/aiQuota.js";

const r = Router();

r.use(requireAuth);
r.use(aiLimiter);
r.use(requireAiCredit);

r.post("/code-review", ai.postCodeReview);
r.post("/coach/explain", ai.postCoachExplain);
r.post("/coach/hint", ai.postCoachHint);
r.post("/coach/compare", ai.postCoachCompare);
r.post("/weakness", ai.postWeakness);
r.post("/mock/evaluate", ai.postMockEvaluate);
r.post("/roadmap", ai.postRoadmap);
r.post("/submission-mentor", ai.postSubmissionMentor);

export default r;
