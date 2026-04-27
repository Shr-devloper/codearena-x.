import { Buffer } from "buffer";
import { env, isJudge0Configured } from "../config/env.js";
import { getJudge0LanguageId } from "../config/languages.js";
import { normalizeOutput, outputsEqual } from "../utils/outputCompare.js";

const STATUS = {
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_SIGSEGV: 7,
  RUNTIME_SIGXFSZ: 8,
  RUNTIME_SIGFPE: 9,
  RUNTIME_SIGABRT: 10,
  RUNTIME_NZEC: 11,
  RUNTIME_OTHER: 12,
  OUT_OF_MEMORY: 15,
};

function buildHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (env.JUDGE0_RAPIDAPI_HOST && env.JUDGE0_API_KEY) {
    headers["X-RapidAPI-Host"] = env.JUDGE0_RAPIDAPI_HOST;
    headers["X-RapidAPI-Key"] = env.JUDGE0_API_KEY;
  } else if (env.JUDGE0_API_KEY) {
    headers["X-Auth-Token"] = env.JUDGE0_API_KEY;
  }
  return headers;
}

function decodeB64Maybe(val) {
  if (val == null || val === "") return "";
  if (typeof val !== "string") return String(val);
  try {
    return Buffer.from(val, "base64").toString("utf-8");
  } catch {
    return val;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Judge0: In Queue / Processing — terminal states use other ids (3+, etc.). */
const STATUS_QUEUED = 1;
const STATUS_PROCESSING = 2;

function parseJudge0Data(data) {
  const statusId = data?.status?.id ?? data?.status_id;
  const stdout = decodeB64Maybe(data?.stdout);
  const stderr = decodeB64Maybe(data?.stderr);
  const compileOut = decodeB64Maybe(data?.compile_output);

  const timeSec = data?.time != null ? parseFloat(String(data.time)) : null;
  const timeMs = timeSec != null && !Number.isNaN(timeSec) ? timeSec * 1000 : null;
  const memoryKb =
    data?.memory != null ? parseInt(String(data.memory), 10) : null;

  return {
    statusId,
    statusDescription: data?.status?.description || "",
    stdout,
    stderr,
    compileOut,
    timeMs,
    memoryKb,
  };
}

/**
 * Create a submission with wait=false, then poll until a terminal status.
 * Avoids proxy/load-balancer timeouts that often break wait=true on multi-case runs.
 */
export async function runJudge0Case({ code, language, stdin }) {
  if (!isJudge0Configured()) {
    const err = new Error("Judge0 is not configured (set JUDGE0_API_URL in .env)");
    err.status = 503;
    throw err;
  }

  const languageId = getJudge0LanguageId(language);
  const payload = {
    source_code: Buffer.from(code, "utf-8").toString("base64"),
    language_id: languageId,
    stdin: Buffer.from(stdin ?? "", "utf-8").toString("base64"),
  };

  const base = String(env.JUDGE0_API_URL || "").replace(/\/$/, "");
  const createUrl = `${base}/submissions?base64_encoded=true&wait=false`;

  const res = await fetch(createUrl, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const t = await res.text();
    const err = new Error(`Judge0 error ${res.status}: ${t.slice(0, 300)}`);
    err.status = 502;
    throw err;
  }

  const created = await res.json();
  const token = created?.token;
  if (!token || typeof token !== "string") {
    const err = new Error("Judge0 did not return a submission token");
    err.status = 502;
    throw err;
  }

  const maxWait = env.JUDGE0_MAX_WAIT_MS;
  const pollMs = env.JUDGE0_POLL_MS;
  const deadline = Date.now() + maxWait;

  while (Date.now() < deadline) {
    const pollUrl = `${base}/submissions/${encodeURIComponent(token)}?base64_encoded=true`;
    const pr = await fetch(pollUrl, { headers: buildHeaders() });

    if (!pr.ok) {
      const t = await pr.text();
      const err = new Error(`Judge0 poll error ${pr.status}: ${t.slice(0, 300)}`);
      err.status = 502;
      throw err;
    }

    const data = await pr.json();
    const statusId = data?.status?.id ?? data?.status_id;

    if (statusId == null) {
      await sleep(pollMs);
      continue;
    }

    if (statusId !== STATUS_QUEUED && statusId !== STATUS_PROCESSING) {
      return parseJudge0Data(data);
    }

    await sleep(pollMs);
  }

  const err = new Error("Judge0 execution timed out (exceeded JUDGE0_MAX_WAIT_MS)");
  err.status = 504;
  throw err;
}

/**
 * Map Judge0 status + optional I/O compare to AC/WA/TLE/MLE/CE/RE.
 */
export function verdictForTestCase(parsed, expectedOutput) {
  const sid = parsed.statusId;

  if (sid === STATUS.COMPILATION_ERROR) {
    return {
      verdict: "CE",
      error: parsed.compileOut || "Compilation error",
    };
  }
  if (sid === STATUS.TIME_LIMIT) {
    return { verdict: "TLE", runtimeMs: parsed.timeMs, memoryKb: parsed.memoryKb };
  }
  if (sid === STATUS.OUT_OF_MEMORY) {
    return { verdict: "MLE", runtimeMs: parsed.timeMs, memoryKb: parsed.memoryKb };
  }
  if (
    [
      STATUS.WRONG_ANSWER,
      STATUS.RUNTIME_SIGSEGV,
      STATUS.RUNTIME_SIGXFSZ,
      STATUS.RUNTIME_SIGFPE,
      STATUS.RUNTIME_SIGABRT,
      STATUS.RUNTIME_NZEC,
      STATUS.RUNTIME_OTHER,
    ].includes(sid)
  ) {
    return {
      verdict: sid === STATUS.WRONG_ANSWER ? "WA" : "RE",
      runtimeMs: parsed.timeMs,
      memoryKb: parsed.memoryKb,
      stdout: normalizeOutput(parsed.stdout),
      error: parsed.stderr || parsed.statusDescription,
    };
  }

  if (sid === STATUS.ACCEPTED) {
    if (outputsEqual(parsed.stdout, expectedOutput)) {
      return {
        verdict: "AC",
        runtimeMs: parsed.timeMs,
        memoryKb: parsed.memoryKb,
        stdout: normalizeOutput(parsed.stdout),
      };
    }
    return {
      verdict: "WA",
      runtimeMs: parsed.timeMs,
      memoryKb: parsed.memoryKb,
      stdout: normalizeOutput(parsed.stdout),
      error: "Output does not match expected",
    };
  }

  return {
    verdict: "RE",
    error: parsed.statusDescription || parsed.stderr || "Unknown status",
    runtimeMs: parsed.timeMs,
    memoryKb: parsed.memoryKb,
  };
}

