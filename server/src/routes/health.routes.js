import { Router } from "express";
import mongoose from "mongoose";
import { isGroqConfigured, isJudge0Configured, isRazorpayConfigured } from "../config/env.js";

const r = Router();

r.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "codearena-x-api",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    groq: isGroqConfigured() ? "configured" : "missing_key",
    judge0: isJudge0Configured() ? "configured" : "missing_url",
    razorpay: isRazorpayConfigured() ? "configured" : "missing_keys",
  });
});

export default r;
