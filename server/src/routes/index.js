import { Router } from "express";
import { env } from "../config/env.js";
import health from "./health.routes.js";
import auth from "./auth.routes.js";
import ai from "./ai.routes.js";
import dashboard from "./dashboard.routes.js";
import payment from "./payment.routes.js";
import problems from "./problem.routes.js";
import chambers from "./chamber.routes.js";
import interview from "./interview.routes.js";
import debug from "./debug.routes.js";

const api = Router();

api.use("/health", health);
api.use("/auth", auth);
api.use("/ai", ai);
api.use("/dashboard", dashboard);
api.use("/payment", payment);
api.use("/chambers", chambers);
api.use("/problems", problems);
api.use("/interview", interview);
if (env.NODE_ENV === "development") {
  api.use("/debug", debug);
}

export default api;
