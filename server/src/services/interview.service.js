import { MockInterviewSession } from "../models/MockInterviewSession.js";
import { mockInterviewQuestion, evaluateMockAnswer } from "./ai.service.js";

export async function startSession(userId, { role, durationMinutes }) {
  const d = Math.min(180, Math.max(5, Number(durationMinutes) || 30));
  const r = String(role || "").trim();
  if (r.length < 2) {
    const err = new Error("Describe a role (e.g. “Backend intern”) with at least a couple of characters.");
    err.status = 400;
    throw err;
  }

  const q = await mockInterviewQuestion({ role: r, durationMinutes: d });
  const main = String(q?.question || "").trim();
  if (!main) {
    const err = new Error("We couldn’t generate a question. Try again in a moment.");
    err.status = 502;
    throw err;
  }

  const s = await MockInterviewSession.create({
    user: userId,
    role: r,
    durationMinutes: d,
    question: main,
    followUps: Array.isArray(q?.followUps) ? q.followUps.map((x) => String(x)) : [],
    status: "active",
  });

  return {
    id: s._id,
    question: s.question,
    followUps: s.followUps,
    durationMinutes: s.durationMinutes,
    role: s.role,
  };
}

export async function completeSession(userId, sessionId, { answer }) {
  const text = String(answer ?? "").trim();
  if (!text) {
    const err = new Error("Add your answer before sending.");
    err.status = 400;
    throw err;
  }
  if (text.length > 20_000) {
    const err = new Error("Answer is too long. Shorten to under 20,000 characters.");
    err.status = 400;
    throw err;
  }

  const s = await MockInterviewSession.findOne({ _id: sessionId, user: userId });
  if (!s) {
    const err = new Error("Session not found");
    err.status = 404;
    throw err;
  }
  if (s.status === "complete") {
    const err = new Error("This session is already complete");
    err.status = 400;
    throw err;
  }

  const feedback = await evaluateMockAnswer({
    role: s.role,
    question: s.question,
    answer: text,
  });

  s.answer = text;
  s.feedback = feedback;
  s.status = "complete";
  await s.save();

  return { id: s._id, feedback, session: s.toObject() };
}

export async function getSessionForUser(userId, sessionId) {
  return MockInterviewSession.findOne({ _id: sessionId, user: userId }).lean();
}
