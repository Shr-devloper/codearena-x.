import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as pay from "../controllers/payment.controller.js";

const r = Router();

r.use(requireAuth);
r.post("/create-order", pay.postCreateOrder);
r.post("/verify", pay.postVerify);
r.post("/upgrade", pay.postUpgrade);
r.get("/billing", pay.getBilling);
r.get("/plan", pay.getPlan);

export default r;
