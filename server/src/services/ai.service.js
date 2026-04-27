import Groq from "groq-sdk";
import { env, isGroqConfigured } from "../config/env.js";
import { parseJsonFromLlm } from "../utils/parseJsonFromLlm.js";
import {
  buildCodeReviewMessages,
  buildCoachExplainMessages,
  buildCoachHintMessages,
  buildCompareMessages,
  buildWeaknessMessages,
  buildMockInterviewEvaluateMessages,
  buildMockInterviewQuestionMessages,
  buildRoadmapMessages,
  buildSubmissionMentorMessages,
} from "../prompts/index.js";

let _client;

function getClient() {
  if (!isGroqConfigured()) {
    const err = new Error("GROQ_API_KEY is not configured");
    err.status = 503;
    throw err;
  }
  if (!_client) {
    _client = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return _client;
}

const MAX_OUT = 4096;

async function chatJson({ system, user, temperature = 0.2 }) {
  const client = getClient();
  const base = {
    model: env.GROQ_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    max_tokens: MAX_OUT,
  };
  let completion;
  try {
    completion = await client.chat.completions.create({
      ...base,
      response_format: { type: "json_object" },
    });
  } catch {
    completion = await client.chat.completions.create(base);
  }
  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    const err = new Error("No response returned. Try again shortly.");
    err.status = 502;
    throw err;
  }
  try {
    return parseJsonFromLlm(raw);
  } catch (e) {
    const err = new Error("Couldn’t read that response. Try again in a moment.");
    err.status = 502;
    err.cause = e;
    throw err;
  }
}

export async function reviewCode(payload) {
  const { problemTitle, problemDescription, language, code } = payload;
  const { system, user } = buildCodeReviewMessages({
    problemTitle,
    problemDescription,
    language,
    code,
  });
  return chatJson({ system, user, temperature: 0.15 });
}

export async function coachExplain(payload) {
  const { problemTitle, problemDescription } = payload;
  const { system, user } = buildCoachExplainMessages({
    problemTitle,
    problemDescription,
  });
  return chatJson({ system, user, temperature: 0.25 });
}

export async function coachHint(payload) {
  const { problemTitle, problemDescription, language, code, level } = payload;
  const { system, user } = buildCoachHintMessages({
    problemTitle,
    problemDescription,
    language,
    code,
    level,
  });
  return chatJson({ system, user, temperature: 0.35 });
}

export async function coachCompare(payload) {
  const { problemTitle, problemDescription, language, userCode, optimalOutline } =
    payload;
  const { system, user } = buildCompareMessages({
    problemTitle,
    problemDescription,
    language,
    userCode,
    optimalOutline,
  });
  return chatJson({ system, user, temperature: 0.2 });
}

export async function analyzeWeakness(payload) {
  const { recentSubmissionsSummary, topicStats } = payload;
  const { system, user } = buildWeaknessMessages({
    recentSubmissionsSummary,
    topicStats,
  });
  return chatJson({ system, user, temperature: 0.25 });
}

export async function evaluateMockAnswer(payload) {
  const { role, question, answer } = payload;
  const { system, user } = buildMockInterviewEvaluateMessages({
    role,
    question,
    answer,
  });
  return chatJson({ system, user, temperature: 0.2 });
}

/** One question + follow-ups for a mock session (GROQ). */
export async function mockInterviewQuestion(payload) {
  const { role, durationMinutes } = payload;
  const { system, user } = buildMockInterviewQuestionMessages({
    role,
    durationMinutes,
  });
  return chatJson({ system, user, temperature: 0.25 });
}

export async function generateRoadmap(payload) {
  const { planType, focusRole, company, skillSummary } = payload;
  const { system, user } = buildRoadmapMessages({
    planType,
    focusRole,
    company,
    skillSummary,
  });
  return chatJson({ system, user, temperature: 0.35 });
}

/**
 * Mentor feedback after a non-AC Judge0 result. Does not reveal full solutions.
 */
export async function submissionMentor(payload) {
  const {
    problemTitle,
    problemDescription,
    language,
    code,
    verdict,
    expectedOutput,
    actualOutput,
    judgeMessage,
  } = payload;

  if (!problemDescription || !language || !code || !verdict) {
    const err = new Error(
      "problemDescription, language, code, and verdict are required"
    );
    err.status = 400;
    throw err;
  }

  const { system, user } = buildSubmissionMentorMessages({
    problemTitle: problemTitle || "Problem",
    problemDescription,
    language,
    userCode: code,
    verdict,
    expectedOutput,
    actualOutput,
    judgeMessage,
  });
  return chatJson({ system, user, temperature: 0.25 });
}
