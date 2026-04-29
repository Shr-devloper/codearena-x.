import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import { env, isCorsOriginAllowed } from "./config/env.js";
import api from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (isCorsOriginAllowed(origin)) {
          callback(null, true);
          return;
        }
        if (env.NODE_ENV === "development") {
          console.warn("[CORS] Blocked Origin:", origin);
        }
        callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
  app.use(passport.initialize());

  app.get("/", (req, res) => {
    res.json({ service: "CodeArena X API", docs: "/api/health" });
  });

  app.use("/api", api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
